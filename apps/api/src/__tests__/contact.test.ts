import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { DatabaseService } from "../database.js";
import { ContactMailer, TurnstileService } from "../contact/contact.js";
import { AppModule } from "../server.js";

const resendSend = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resendSend };
  },
}));

const origin = "http://localhost:3000";
const valid = {
  name: "Ada",
  email: "ada@example.com",
  message: "Hola, me gustaría hablar de un proyecto.",
  turnstileToken: "token",
};

describe("POST /contact", () => {
  const previous = { ...process.env };
  let app: NestFastifyApplication;
  const verify = vi.fn();
  const send = vi.fn();

  async function create(mailer: unknown = { send }) {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue({ check: async () => {} })
      .overrideProvider(TurnstileService)
      .useValue({ verify })
      .overrideProvider(ContactMailer)
      .useValue(mailer)
      .compile();
    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  }

  const post = (
    payload: unknown,
    headers: Record<string, string> = { origin },
  ) =>
    app.inject({
      method: "POST",
      url: "/contact",
      headers,
      payload: payload as object,
    });

  beforeEach(() => {
    process.env.WEB_ORIGIN = origin;
    verify.mockReset().mockResolvedValue(true);
    send.mockReset().mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await app.close();
    process.env = { ...previous };
  });

  it("entrega el mensaje sin sesión cuando la verificación es válida", async () => {
    await create();
    const response = await post(valid);
    expect(response.statusCode).toBe(202);
    expect(send).toHaveBeenCalledWith({
      name: "Ada",
      email: "ada@example.com",
      message: valid.message,
    });
    expect(verify).toHaveBeenCalledWith("token", undefined);
  });

  it("rechaza un origen ajeno o ausente con 403", async () => {
    await create();
    expect(
      (await post(valid, { origin: "https://otro.example" })).statusCode,
    ).toBe(403);
    expect((await post(valid, {})).statusCode).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it("devuelve errores por campo y no verifica ni envía", async () => {
    await create();
    const response = await post({
      name: " ",
      email: "no-es-correo",
      message: "corto",
      extra: true,
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().fields).toMatchObject({
      form: expect.any(String),
      name: expect.any(String),
      email: "Introduce un correo válido.",
      message: expect.any(String),
      turnstileToken: "Completa la verificación.",
    });
    expect(verify).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("rechaza un token de Turnstile inválido", async () => {
    verify.mockResolvedValue(false);
    await create();
    const response = await post(valid);
    expect(response.statusCode).toBe(400);
    expect(response.json().fields.turnstileToken).toBeDefined();
    expect(send).not.toHaveBeenCalled();
  });

  it("responde 503 mientras Resend no esté configurado", async () => {
    delete process.env.RESEND_API_KEY;
    await create(new ContactMailer());
    const response = await post(valid);
    expect(response.statusCode).toBe(503);
  });

  it("envía el correo con Resend y responde a quien escribió", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.CONTACT_TO_EMAIL = "yo@example.com";
    process.env.CONTACT_FROM_EMAIL = "Portafolio <contacto@example.com>";
    resendSend.mockResolvedValue({ data: { id: "1" }, error: null });
    await create(new ContactMailer());
    const response = await post(valid);
    expect(response.statusCode).toBe(202);
    expect(resendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Portafolio <contacto@example.com>",
        to: "yo@example.com",
        replyTo: "ada@example.com",
      }),
    );
  });

  it("responde 503 si Resend devuelve un error", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.CONTACT_TO_EMAIL = "yo@example.com";
    process.env.CONTACT_FROM_EMAIL = "contacto@example.com";
    resendSend.mockResolvedValue({ data: null, error: { message: "fallo" } });
    await create(new ContactMailer());
    expect((await post(valid)).statusCode).toBe(503);
  });
});
