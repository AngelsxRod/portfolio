import "reflect-metadata";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray } from "drizzle-orm";
import { AppModule } from "../server.js";
import { DatabaseService } from "../database.js";
import * as schema from "../db/schema.js";
import { hashPassword } from "../auth/password.js";

// Run against a migrated disposable database, never the portfolio database.
describe.runIf(Boolean(process.env.TEST_DATABASE_URL))(
  "certificates HTTP routes",
  () => {
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    const origin = "http://localhost:3000";
    const secret = "cert-test-proxy-secret-at-least-32-characters";
    const ids: string[] = [];
    const previous = { ...process.env };
    let app: NestFastifyApplication;
    let cookie: string;

    beforeAll(async () => {
      process.env.WEB_ORIGIN = origin;
      process.env.ADMIN_PROXY_SECRET = secret;
      process.env.ADMIN_USERNAME = "cert-test-admin";
      process.env.ADMIN_PASSWORD_HASH = await hashPassword(
        "cert-test-password",
        randomBytes(32),
      );
      const module = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(DatabaseService)
        .useValue({ getDatabase: () => db })
        .compile();
      app = module.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter(),
      );
      await app.init();
      await app.getHttpAdapter().getInstance().ready();
      const login = await app.inject({
        method: "POST",
        url: "/auth/login",
        headers: { origin, "x-admin-proxy-secret": secret },
        payload: {
          username: "cert-test-admin",
          password: "cert-test-password",
        },
      });
      expect(login.statusCode).toBe(200);
      cookie = String(login.headers["set-cookie"]).split(";")[0]!;
    });

    afterAll(async () => {
      if (ids.length)
        await db
          .delete(schema.certificates)
          .where(inArray(schema.certificates.id, ids));
      if (cookie) {
        const token = cookie.slice(cookie.indexOf("=") + 1);
        await db
          .delete(schema.adminSessions)
          .where(
            eq(
              schema.adminSessions.tokenHash,
              createHash("sha256").update(token).digest("hex"),
            ),
          );
      }
      await app?.close();
      await pool.end();
      for (const key of [
        "WEB_ORIGIN",
        "ADMIN_PROXY_SECRET",
        "ADMIN_USERNAME",
        "ADMIN_PASSWORD_HASH",
      ]) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    });

    const base = "/admin/certificates";

    function payload(extra: object = {}) {
      return {
        name: `Certificado ${randomUUID()}`,
        issuer: "Emisor de prueba",
        issueDate: "2020-03",
        ...extra,
      };
    }

    async function create(body: unknown = payload()) {
      const result = await app.inject({
        method: "POST",
        url: base,
        headers: { cookie, origin },
        payload: body as object,
      });
      if (result.statusCode === 201) ids.push(result.json().id);
      return result;
    }

    function write(method: "PUT" | "POST", url: string, body?: object) {
      return app.inject({
        method,
        url,
        headers: { cookie, origin },
        payload: body,
      });
    }

    async function publicList() {
      const result = await app.inject({ method: "GET", url: "/certificates" });
      expect(result.statusCode).toBe(200);
      expect(result.headers["cache-control"]).toBe("no-store");
      return result.json() as { id: string; name: string }[];
    }

    it("persists a trimmed draft with defaults and retrieves it", async () => {
      const body = payload();
      const created = await create({
        ...body,
        name: `  ${body.name}  `,
        description: "   ",
        verificationUrl: "  ",
      });
      expect(created.statusCode).toBe(201);
      expect(created.json()).toMatchObject({
        name: body.name,
        issuer: "Emisor de prueba",
        issueDate: "2020-03",
        verificationUrl: null,
        description: null,
        position: 0,
        status: "draft",
      });
      const { id } = created.json();
      const found = await app.inject({
        method: "GET",
        url: `${base}/${id}`,
        headers: { cookie },
      });
      expect(found.statusCode).toBe(200);
      expect(found.headers["cache-control"]).toBe("no-store");
      expect(found.json()).toMatchObject({ id, name: body.name });
    });

    it("stores every field and edits a draft", async () => {
      const created = await create(
        payload({
          verificationUrl: " https://example.com/verify?id=1 ",
          description: " Descripción ",
          position: 4,
        }),
      );
      expect(created.json()).toMatchObject({
        verificationUrl: "https://example.com/verify?id=1",
        description: "Descripción",
        position: 4,
      });
      const { id, updatedAt, name } = created.json();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const edited = await write("PUT", `${base}/${id}`, {
        name,
        issuer: "Otro emisor",
        issueDate: "2019-12",
      });
      expect(edited.statusCode).toBe(200);
      expect(edited.json()).toMatchObject({
        issuer: "Otro emisor",
        issueDate: "2019-12",
        verificationUrl: null,
        description: null,
        position: 0,
      });
      expect(new Date(edited.json().updatedAt).getTime()).toBeGreaterThan(
        new Date(updatedAt).getTime(),
      );
    });

    const valid = { name: "N", issuer: "I", issueDate: "2020-05" };

    it.each([
      [{ issuer: "I", issueDate: "2020-05" }, "name"],
      [{ ...valid, name: "  " }, "name"],
      [{ ...valid, name: "x".repeat(161) }, "name"],
      [{ ...valid, name: 5 }, "name"],
      [{ name: "N", issueDate: "2020-05" }, "issuer"],
      [{ ...valid, issuer: "x".repeat(121) }, "issuer"],
      [{ name: "N", issuer: "I" }, "issueDate"],
      [{ ...valid, issueDate: "2020-13" }, "issueDate"],
      [{ ...valid, issueDate: "1899-12" }, "issueDate"],
      [{ ...valid, issueDate: "2020-01-15" }, "issueDate"],
      [{ ...valid, issueDate: 2020 }, "issueDate"],
      [{ ...valid, verificationUrl: "no es url" }, "verificationUrl"],
      [{ ...valid, verificationUrl: "javascript:alert(1)" }, "verificationUrl"],
      [{ ...valid, verificationUrl: "ftp://example.com/x" }, "verificationUrl"],
      [
        { ...valid, verificationUrl: "https://u:p@example.com" },
        "verificationUrl",
      ],
      [
        {
          ...valid,
          verificationUrl: `https://example.com/${"a".repeat(2048)}`,
        },
        "verificationUrl",
      ],
      [{ ...valid, verificationUrl: 5 }, "verificationUrl"],
      [{ ...valid, description: "x".repeat(2001) }, "description"],
      [{ ...valid, description: 5 }, "description"],
      [{ ...valid, position: -1 }, "position"],
      [{ ...valid, position: 1.5 }, "position"],
      [{ ...valid, position: "1" }, "position"],
      [{ ...valid, position: 2147483648 }, "position"],
      [{ ...valid, status: "published" }, "form"],
      [{ ...valid, id: randomUUID() }, "form"],
      [{ ...valid, createdAt: "2020-01-01" }, "form"],
    ])("rejects invalid input %j with a message for %s", async (body, key) => {
      const result = await create(body);
      expect(result.statusCode).toBe(400);
      expect(result.json().fields).toHaveProperty(key);
    });

    it("reports every invalid field at once", async () => {
      const result = await create({});
      expect(result.statusCode).toBe(400);
      expect(Object.keys(result.json().fields).sort()).toEqual([
        "issueDate",
        "issuer",
        "name",
      ]);
    });

    it("rejects a non-object body and malformed ids", async () => {
      expect((await create([])).statusCode).toBe(400);
      for (const method of ["GET", "PUT", "POST"] as const) {
        const url =
          method === "POST"
            ? `${base}/no-es-uuid/publish`
            : `${base}/no-es-uuid`;
        const result = await app.inject({
          method,
          url,
          headers: { cookie, origin },
          payload: method === "GET" ? undefined : payload(),
        });
        expect(result.statusCode).toBe(400);
      }
    });

    it("returns 404 for unknown records", async () => {
      const id = randomUUID();
      expect(
        (
          await app.inject({
            method: "GET",
            url: `${base}/${id}`,
            headers: { cookie },
          })
        ).statusCode,
      ).toBe(404);
      expect((await write("PUT", `${base}/${id}`, payload())).statusCode).toBe(
        404,
      );
      expect((await write("POST", `${base}/${id}/publish`)).statusCode).toBe(
        404,
      );
      expect((await write("POST", `${base}/${id}/unpublish`)).statusCode).toBe(
        404,
      );
    });

    it("denies access without a session or with a missing or foreign origin", async () => {
      const { id } = (await create()).json();
      const requests = [
        ["POST", base, payload()],
        ["PUT", `${base}/${id}`, payload()],
        ["POST", `${base}/${id}/publish`, undefined],
        ["POST", `${base}/${id}/unpublish`, undefined],
      ] as const;
      for (const [method, url, body] of requests) {
        const anonymous = await app.inject({
          method,
          url,
          headers: { origin },
          payload: body,
        });
        expect(anonymous.statusCode).toBe(401);
        for (const headers of [
          { cookie },
          { cookie, origin: "https://evil.example" },
        ]) {
          const result = await app.inject({
            method,
            url,
            headers,
            payload: body,
          });
          expect(result.statusCode).toBe(403);
        }
      }
      expect(
        (await app.inject({ method: "GET", url: `${base}/${id}` })).statusCode,
      ).toBe(401);
      expect((await app.inject({ method: "GET", url: base })).statusCode).toBe(
        401,
      );
      const unchanged = await app.inject({
        method: "GET",
        url: `${base}/${id}`,
        headers: { cookie },
      });
      expect(unchanged.json().status).toBe("draft");
    });

    it("moves a record through draft, published and withdrawn", async () => {
      const body = payload({
        description: "Texto",
        verificationUrl: "https://example.com/v",
      });
      const { id, updatedAt } = (await create(body)).json();
      expect((await publicList()).map((item) => item.id)).not.toContain(id);

      await new Promise((resolve) => setTimeout(resolve, 10));
      const published = await write("POST", `${base}/${id}/publish`);
      expect(published.statusCode).toBe(200);
      expect(published.json().status).toBe("published");
      expect(new Date(published.json().updatedAt).getTime()).toBeGreaterThan(
        new Date(updatedAt).getTime(),
      );
      expect((await publicList()).find((item) => item.id === id)).toEqual({
        id,
        name: body.name,
        issuer: "Emisor de prueba",
        issueDate: "2020-03",
        verificationUrl: "https://example.com/v",
        description: "Texto",
        position: 0,
      });

      // Editing a published record keeps the public version and stores pending changes.
      expect((await write("POST", `${base}/${id}/publish`)).statusCode).toBe(
        404,
      );
      const edited = await write(
        "PUT",
        `${base}/${id}`,
        payload({ name: "Cambio pendiente" }),
      );
      expect(edited.statusCode).toBe(200);
      expect(edited.json().status).toBe("published");
      expect(edited.json().name).toBe(body.name);
      expect(edited.json().pending.name).toBe("Cambio pendiente");
      const live = (await publicList()).find((item) => item.id === id)!;
      expect(live.name).toBe(body.name);
      expect("pending" in live).toBe(false);

      const discarded = await write("POST", `${base}/${id}/discard`);
      expect(discarded.statusCode).toBe(200);
      expect(discarded.json().pending).toBeNull();
      expect((await write("POST", `${base}/${id}/discard`)).statusCode).toBe(
        404,
      );

      await write("PUT", `${base}/${id}`, payload({ name: "Versión nueva" }));
      const applied = await write("POST", `${base}/${id}/publish`);
      expect(applied.statusCode).toBe(200);
      expect(applied.json().name).toBe("Versión nueva");
      expect(applied.json().pending).toBeNull();
      expect((await publicList()).find((item) => item.id === id)!.name).toBe(
        "Versión nueva",
      );

      const withdrawn = await write("POST", `${base}/${id}/unpublish`);
      expect(withdrawn.statusCode).toBe(200);
      expect(withdrawn.json().status).toBe("draft");
      expect((await publicList()).map((item) => item.id)).not.toContain(id);
      expect((await write("POST", `${base}/${id}/unpublish`)).statusCode).toBe(
        404,
      );
      expect((await write("PUT", `${base}/${id}`, payload())).statusCode).toBe(
        200,
      );
    });

    it("lists only published records, by position then newest issue date", async () => {
      const lateStart = await create(
        payload({ position: 900, issueDate: "2023-01" }),
      );
      const earlyStart = await create(
        payload({ position: 900, issueDate: "2018-01" }),
      );
      const first = await create(
        payload({ position: 800, issueDate: "2010-01" }),
      );
      const hidden = await create(payload({ position: 0 }));
      for (const created of [lateStart, earlyStart, first])
        await write("POST", `${base}/${created.json().id}/publish`);
      const mine = [first, lateStart, earlyStart, hidden].map(
        (r) => r.json().id,
      );
      const found = (await publicList())
        .map((item) => item.id)
        .filter((id) => mine.includes(id));
      expect(found).toEqual(
        [first, lateStart, earlyStart].map((r) => r.json().id),
      );
      const text = JSON.stringify(await publicList());
      expect(text).not.toContain("status");
      expect(text).not.toContain("createdAt");
      expect(text).not.toContain("updatedAt");
    });

    it("enforces database constraints beyond the API", async () => {
      const insert = (values: Record<string, unknown>) =>
        pool.query(
          `insert into certificates (name, issuer, issue_date, verification_url, description)
           values ($1, $2, $3, $4, $5)`,
          [
            values.name ?? "N",
            values.issuer ?? "I",
            "2020-05-01",
            values.url ?? null,
            values.description ?? null,
          ],
        );
      await expect(insert({ name: "  " })).rejects.toMatchObject({
        constraint: "certificates_name_not_blank",
      });
      await expect(insert({ issuer: "" })).rejects.toMatchObject({
        constraint: "certificates_issuer_not_blank",
      });
      await expect(insert({ url: " " })).rejects.toMatchObject({
        constraint: "certificates_url_not_blank",
      });
      await expect(insert({ description: " " })).rejects.toMatchObject({
        constraint: "certificates_description_not_blank",
      });
    });
  },
);
