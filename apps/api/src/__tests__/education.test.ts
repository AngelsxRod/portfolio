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
  "education HTTP routes",
  () => {
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    const origin = "http://localhost:3000";
    const secret = "edu-test-proxy-secret-at-least-32-characters";
    const ids: string[] = [];
    const previous = { ...process.env };
    let app: NestFastifyApplication;
    let cookie: string;

    beforeAll(async () => {
      process.env.WEB_ORIGIN = origin;
      process.env.ADMIN_PROXY_SECRET = secret;
      process.env.ADMIN_USERNAME = "edu-test-admin";
      process.env.ADMIN_PASSWORD_HASH = await hashPassword(
        "edu-test-password",
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
          username: "edu-test-admin",
          password: "edu-test-password",
        },
      });
      expect(login.statusCode).toBe(200);
      cookie = String(login.headers["set-cookie"]).split(";")[0]!;
    });

    afterAll(async () => {
      if (ids.length)
        await db
          .delete(schema.education)
          .where(inArray(schema.education.id, ids));
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

    const base = "/admin/education";

    function payload(extra: object = {}) {
      return {
        institution: `Institución ${randomUUID()}`,
        level: "university",
        program: "Programa de prueba",
        startDate: "2020-03",
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
      const result = await app.inject({ method: "GET", url: "/education" });
      expect(result.statusCode).toBe(200);
      expect(result.headers["cache-control"]).toBe("no-store");
      return result.json() as { id: string; institution: string }[];
    }

    it("persists a trimmed draft with defaults and retrieves it", async () => {
      const body = payload();
      const created = await create({
        ...body,
        institution: `  ${body.institution}  `,
        description: "   ",
      });
      expect(created.statusCode).toBe(201);
      expect(created.json()).toMatchObject({
        institution: body.institution,
        level: "university",
        program: "Programa de prueba",
        startDate: "2020-03",
        endDate: null,
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
      expect(found.json()).toMatchObject({ id, institution: body.institution });
      const list = await app.inject({
        method: "GET",
        url: base,
        headers: { cookie },
      });
      expect(list.json().map((item: { id: string }) => item.id)).toContain(id);
    });

    it("stores every field and edits a draft", async () => {
      const created = await create(
        payload({
          level: "secondary",
          endDate: "2021-06",
          description: " Descripción ",
          position: 4,
        }),
      );
      expect(created.json()).toMatchObject({
        level: "secondary",
        endDate: "2021-06",
        description: "Descripción",
        position: 4,
      });
      const { id, updatedAt, institution } = created.json();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const edited = await write("PUT", `${base}/${id}`, {
        institution,
        level: "other",
        program: "Otro programa",
        startDate: "2019-12",
      });
      expect(edited.statusCode).toBe(200);
      expect(edited.json()).toMatchObject({
        level: "other",
        program: "Otro programa",
        startDate: "2019-12",
        endDate: null,
        description: null,
        position: 0,
      });
      expect(new Date(edited.json().updatedAt).getTime()).toBeGreaterThan(
        new Date(updatedAt).getTime(),
      );
    });

    const valid = {
      institution: "I",
      level: "university",
      program: "P",
      startDate: "2020-05",
    };
    const without = (key: keyof typeof valid) => {
      const { [key]: _omitted, ...rest } = valid;
      return rest;
    };

    it.each([
      [without("institution"), "institution"],
      [{ ...valid, institution: "  " }, "institution"],
      [{ ...valid, institution: "x".repeat(121) }, "institution"],
      [{ ...valid, institution: 5 }, "institution"],
      [without("level"), "level"],
      [{ ...valid, level: "master" }, "level"],
      [{ ...valid, level: "" }, "level"],
      [{ ...valid, level: 1 }, "level"],
      [without("program"), "program"],
      [{ ...valid, program: " " }, "program"],
      [{ ...valid, program: "x".repeat(121) }, "program"],
      [without("startDate"), "startDate"],
      [{ ...valid, startDate: "" }, "startDate"],
      [{ ...valid, startDate: "2020-13" }, "startDate"],
      [{ ...valid, startDate: "2020-00" }, "startDate"],
      [{ ...valid, startDate: "1899-12" }, "startDate"],
      [{ ...valid, startDate: "2020-01-15" }, "startDate"],
      [{ ...valid, startDate: 2020 }, "startDate"],
      [{ ...valid, endDate: "2020-04" }, "endDate"],
      [{ ...valid, endDate: "mayo" }, "endDate"],
      [{ ...valid, endDate: 5 }, "endDate"],
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
        "institution",
        "level",
        "program",
        "startDate",
      ]);
    });

    it("accepts every level and a one-month program", async () => {
      for (const level of ["secondary", "university", "other"]) {
        const result = await create(
          payload({ level, startDate: "2022-02", endDate: "2022-02" }),
        );
        expect(result.statusCode).toBe(201);
        expect(result.json().level).toBe(level);
      }
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
      const body = payload({ description: "Texto", endDate: "2021-01" });
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
        institution: body.institution,
        level: "university",
        program: "Programa de prueba",
        startDate: "2020-03",
        endDate: "2021-01",
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
        payload({ program: "Cambio pendiente" }),
      );
      expect(edited.statusCode).toBe(200);
      expect(edited.json().status).toBe("published");
      expect(edited.json().program).toBe("Programa de prueba");
      expect(edited.json().pending.program).toBe("Cambio pendiente");
      const live = (await publicList()).find(
        (item) => item.id === id,
      ) as unknown as Record<string, unknown>;
      expect(live.program).toBe("Programa de prueba");
      expect("pending" in live).toBe(false);

      const discarded = await write("POST", `${base}/${id}/discard`);
      expect(discarded.statusCode).toBe(200);
      expect(discarded.json().pending).toBeNull();
      expect((await write("POST", `${base}/${id}/discard`)).statusCode).toBe(
        404,
      );

      await write(
        "PUT",
        `${base}/${id}`,
        payload({ program: "Versión nueva" }),
      );
      const applied = await write("POST", `${base}/${id}/publish`);
      expect(applied.statusCode).toBe(200);
      expect(applied.json().program).toBe("Versión nueva");
      expect(applied.json().pending).toBeNull();
      expect(
        (
          (await publicList()).find(
            (item) => item.id === id,
          ) as unknown as Record<string, unknown>
        ).program,
      ).toBe("Versión nueva");

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

    it("lists only published records, by position then newest start", async () => {
      const lateStart = await create(
        payload({ position: 900, startDate: "2023-01" }),
      );
      const earlyStart = await create(
        payload({ position: 900, startDate: "2018-01" }),
      );
      const first = await create(
        payload({ position: 800, startDate: "2010-01" }),
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
          `insert into education (institution, level, program, start_date, end_date, description)
           values ($1, $2, $3, $4, $5, $6)`,
          [
            values.institution ?? "I",
            values.level ?? "other",
            values.program ?? "P",
            values.start ?? "2020-05-01",
            values.end ?? null,
            values.description ?? null,
          ],
        );
      await expect(insert({ end: "2020-04-01" })).rejects.toMatchObject({
        constraint: "education_dates_ordered",
      });
      await expect(insert({ institution: "  " })).rejects.toMatchObject({
        constraint: "education_institution_not_blank",
      });
      await expect(insert({ program: "" })).rejects.toMatchObject({
        constraint: "education_program_not_blank",
      });
      await expect(insert({ description: " " })).rejects.toMatchObject({
        constraint: "education_description_not_blank",
      });
      await expect(insert({ level: "phd" })).rejects.toMatchObject({
        code: "22P02",
      });
    });
  },
);
