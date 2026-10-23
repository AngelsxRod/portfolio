import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Injectable,
  Logger,
  Post,
  Req,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Resend } from "resend";
import { Public, requireWebOrigin } from "../auth/auth.js";
import { invalid } from "../projects/drafts.js";

export type ContactMessage = {
  name: string;
  email: string;
  message: string;
};

const allowed = ["name", "email", "message", "turnstileToken"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function contactInput(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    invalid({ form: "Se esperaba un objeto." });
  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  if (Object.keys(data).some((key) => !allowed.includes(key)))
    errors.form = "La solicitud contiene campos no permitidos.";

  const read = (key: string, min: number, max: number) => {
    const value = data[key];
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length < min || trimmed.length > max)
      errors[key] = `Usa entre ${min} y ${max} caracteres.`;
    return trimmed;
  };

  const name = read("name", 1, 120);
  const email = read("email", 1, 254);
  if (!errors.email && !emailPattern.test(email))
    errors.email = "Introduce un correo válido.";
  const message = read("message", 10, 4000);
  const token =
    typeof data.turnstileToken === "string" ? data.turnstileToken : "";
  if (!token || token.length > 2048)
    errors.turnstileToken = "Completa la verificación.";

  if (Object.keys(errors).length > 0) invalid(errors);
  return { message: { name, email, message }, token };
}

/** Valida el token de Cloudflare Turnstile en el servidor. */
@Injectable()
export class TurnstileService {
  async verify(token: string, remoteIp?: string) {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret)
      throw new ServiceUnavailableException(
        "TURNSTILE_SECRET_KEY is not configured",
      );
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);
    try {
      // El compilador de Vercel resuelve `Response` sin los tipos de Node.
      const response = (await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body,
          signal: AbortSignal.timeout(8000),
        },
      )) as unknown as {
        ok: boolean;
        status: number;
        json(): Promise<unknown>;
      };
      if (!response.ok) throw new Error(`siteverify ${response.status}`);
      const result = (await response.json()) as { success?: boolean };
      return result.success === true;
    } catch (error) {
      new Logger("Turnstile").error(error);
      throw new ServiceUnavailableException(
        "No se pudo verificar el mensaje. Inténtalo de nuevo.",
      );
    }
  }
}

/** Entrega los mensajes del formulario por correo con Resend. */
@Injectable()
export class ContactMailer {
  async send({ name, email, message }: ContactMessage) {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL;
    if (!apiKey || !to || !from)
      throw new ServiceUnavailableException(
        "El envío de mensajes todavía no está configurado.",
      );

    const { error } = await new Resend(apiKey).emails.send({
      from,
      to,
      replyTo: email,
      subject: `Mensaje de contacto de ${name}`.slice(0, 200),
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${message}`,
    });
    if (error) {
      new Logger("ContactMailer").error(error);
      throw new ServiceUnavailableException(
        "No se pudo enviar el mensaje. Inténtalo de nuevo.",
      );
    }
  }
}

@Controller("contact")
export class ContactController {
  constructor(
    @Inject(TurnstileService) private readonly turnstile: TurnstileService,
    @Inject(ContactMailer) private readonly mailer: ContactMailer,
  ) {}

  @Post()
  @Public()
  @HttpCode(202)
  async send(
    @Req()
    request: {
      headers: { origin?: string; "x-contact-client-ip"?: string };
    },
    @Body() body: unknown,
  ) {
    requireWebOrigin(request.headers.origin);
    const { message, token } = contactInput(body);
    const human = await this.turnstile.verify(
      token,
      request.headers["x-contact-client-ip"],
    );
    if (!human)
      invalid({ turnstileToken: "No se pudo verificar que seas una persona." });
    await this.mailer.send(message);
    return { ok: true };
  }
}
