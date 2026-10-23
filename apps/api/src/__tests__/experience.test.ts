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
  "experience HTTP routes",
  () => {
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    const origin = "http://localhost:3000";
    const secret = "exp-test-proxy-secret-at-least-32-characters";
    const ids: string[] = [];
    const previous = { ...process.env };
    let app: NestFastifyApplication;
    let cookie: string;

    beforeAll(async () => {
      process.env.WEB_ORIGIN = origin;
      process.env.ADMIN_PROXY_SECRET = secret;
      process.env.ADMIN_USERNAME = "exp-test-admin";
      process.env.ADMIN_PASSWORD_HASH = await hashPassword(
        "exp-test-password",
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
          username: "exp-test-admin",
          password: "exp-test-password",
        },
      });
      expect(login.statusCode).toBe(200);
      cookie = String(login.headers["set-cookie"]).split(";")[0]!;
    });

    afterAll(async () => {
      if (ids.length)
        await db
          .delete(schema.experiences)
          .where(inArray(schema.experiences.id, ids));
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

    const base = "/admin/experience";

    function payload(extra: object = {}) {
      return {
        organization: `Organización ${randomUUID()}`,
        title: "Puesto de prueba",
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
      const result = await app.inject({ method: "GET", url: "/experience" });
      expect(result.statusCode).toBe(200);
      expect(result.headers["cache-control"]).toBe("no-store");
      return result.json() as { id: string; organization: string }[];
    }

    it("persists a trimmed draft with defaults and retrieves it", async () => {
      const body = payload();
      const created = await create({
        ...body,
        organization: `  ${body.organization}  `,
        description: "   ",
      });
      expect(created.statusCode).toBe(201);
      expect(created.json()).toMatchObject({
        organization: body.organization,
        title: "Puesto de prueba",
        startDate: "2020-03",
        endDate: null,
        description: null,
        achievements: [],
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
      expect(found.json()).toMatchObject({
        id,
        organization: body.organization,
      });
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
          endDate: "2021-06",
          description: " Descripción ",
          achievements: [" Uno ", "Dos"],
          position: 4,
        }),
      );
      expect(created.json()).toMatchObject({
        endDate: "2021-06",
        description: "Descripción",
        achievements: ["Uno", "Dos"],
        position: 4,
      });
      const { id, updatedAt, organization } = created.json();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const edited = await write("PUT", `${base}/${id}`, {
        organization,
        title: "Otro puesto",
        startDate: "2019-12",
      });
      expect(edited.statusCode).toBe(200);
      expect(edited.json()).toMatchObject({
        title: "Otro puesto",
        startDate: "2019-12",
        endDate: null,
        description: null,
        achievements: [],
        position: 0,
      });
      expect(new Date(edited.json().updatedAt).getTime()).toBeGreaterThan(
        new Date(updatedAt).getTime(),
      );
    });

    it.each([
      [{ title: "T", startDate: "2020-01" }, "organization"],
      [{ organization: "", title: "T", startDate: "2020-01" }, "organization"],
      [
        { organization: "  ", title: "T", startDate: "2020-01" },
        "organization",
      ],
      [
        { organization: "x".repeat(121), title: "T", startDate: "2020-01" },
        "organization",
      ],
      [{ organization: 5, title: "T", startDate: "2020-01" }, "organization"],
      [{ organization: "O", startDate: "2020-01" }, "title"],
      [{ organization: "O", title: " ", startDate: "2020-01" }, "title"],
      [
        { organization: "O", title: "x".repeat(121), startDate: "2020-01" },
        "title",
      ],
      [{ organization: "O", title: "T" }, "startDate"],
      [{ organization: "O", title: "T", startDate: "" }, "startDate"],
      [{ organization: "O", title: "T", startDate: "2020-13" }, "startDate"],
      [{ organization: "O", title: "T", startDate: "2020-00" }, "startDate"],
      [{ organization: "O", title: "T", startDate: "2020-01-15" }, "startDate"],
      [{ organization: "O", title: "T", startDate: 2020 }, "startDate"],
      [
        {
          organization: "O",
          title: "T",
          startDate: "2020-05",
          endDate: "2020-04",
        },
        "endDate",
      ],
      [
        {
          organization: "O",
          title: "T",
          startDate: "2020-05",
          endDate: "mayo",
        },
        "endDate",
      ],
      [
        { organization: "O", title: "T", startDate: "2020-05", endDate: 5 },
        "endDate",
      ],
      [
        {
          organization: "O",
          title: "T",
          startDate: "2020-05",
          description: "x".repeat(2001),
        },
        "description",
      ],
      [
        { organization: "O", title: "T", startDate: "2020-05", description: 5 },
        "description",
      ],
      [
        {
          organization: "O",
          title: "T",
          startDate: "2020-05",
          achievements: "uno",
        },
        "achievements",
      ],
      [
        {
          organization: "O",
          title: "T",
          startDate: "2020-05",
          achievements: [""],
        },
        "achievements",
      ],
      [
        {
          organization: "O",
          title: "T",
          startDate: "2020-05",
          achievements: [5],
        },
        "achievements",
      ],
      [
        {
          organization: "O",
          title: "T",
          startDate: "2020-05",
          achievements: ["x".repeat(301)],
        },
        "achievements",
      ],
      [
        {
          organization: "O",
          title: "T",
          startDate: "2020-05",
          achievements: ["a", " a "],
        },
        "achievements",
      ],
      [
        {
          organization: "O",
          title: "T",
          startDate: "2020-05",
          achievements: Array.from({ length: 11 }, (_, i) => `l${i}`),
        },
        "achievements",
      ],
      [
        { organization: "O", title: "T", startDate: "2020-05", position: -1 },
        "position",
      ],
      [
        { organization: "O", title: "T", startDate: "2020-05", position: 1.5 },
        "position",
      ],
      [
        { organization: "O", title: "T", startDate: "2020-05", position: "1" },
        "position",
      ],
      [
        {
          organization: "O",
          title: "T",
          startDate: "2020-05",
          position: 2147483648,
        },
        "position",
      ],
      [
        {
          organization: "O",
          title: "T",
          startDate: "2020-05",
          status: "published",
        },
        "form",
      ],
      [
        {
          organization: "O",
          title: "T",
          startDate: "2020-05",
          id: randomUUID(),
        },
        "form",
      ],
    ])("rejects invalid input %j with a message for %s", async (body, key) => {
      const result = await create(body);
      expect(result.statusCode).toBe(400);
      expect(result.json().fields).toHaveProperty(key);
    });

    it("accepts a one-month role and ten achievements", async () => {
      const result = await create(
        payload({
          startDate: "2022-02",
          endDate: "2022-02",
          achievements: Array.from({ length: 10 }, (_, i) => `Logro ${i}`),
        }),
      );
      expect(result.statusCode).toBe(201);
      expect(result.json().achievements).toHaveLength(10);
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
        achievements: ["Logro"],
        endDate: "2021-01",
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
        organization: body.organization,
        title: "Puesto de prueba",
        startDate: "2020-03",
        endDate: "2021-01",
        description: "Texto",
        achievements: ["Logro"],
        position: 0,
      });

      // Editing a published record keeps the public version and stores pending changes.
      expect((await write("POST", `${base}/${id}/publish`)).statusCode).toBe(
        404,
      );
      const edited = await write(
        "PUT",
        `${base}/${id}`,
        payload({ title: "Cambio pendiente" }),
      );
      expect(edited.statusCode).toBe(200);
      expect(edited.json().status).toBe("published");
      expect(edited.json().title).toBe("Puesto de prueba");
      expect(edited.json().pending.title).toBe("Cambio pendiente");
      const live = (await publicList()).find(
        (item) => item.id === id,
      ) as unknown as Record<string, unknown>;
      expect(live.title).toBe("Puesto de prueba");
      expect("pending" in live).toBe(false);

      const discarded = await write("POST", `${base}/${id}/discard`);
      expect(discarded.statusCode).toBe(200);
      expect(discarded.json().pending).toBeNull();
      expect((await write("POST", `${base}/${id}/discard`)).statusCode).toBe(
        404,
      );

      await write("PUT", `${base}/${id}`, payload({ title: "Versión nueva" }));
      const applied = await write("POST", `${base}/${id}/publish`);
      expect(applied.statusCode).toBe(200);
      expect(applied.json().title).toBe("Versión nueva");
      expect(applied.json().pending).toBeNull();
      expect(
        (
          (await publicList()).find(
            (item) => item.id === id,
          ) as unknown as Record<string, unknown>
        ).title,
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
      expect(JSON.stringify(await publicList())).not.toContain("status");
    });

    it("enforces database constraints beyond the API", async () => {
      const insert = (values: Record<string, unknown>) =>
        pool.query(
          `insert into experiences (organization, title, start_date, end_date, description, achievements)
           values ($1, $2, $3, $4, $5, $6)`,
          [
            values.organization ?? "O",
            values.title ?? "T",
            values.start ?? "2020-05-01",
            values.end ?? null,
            values.description ?? null,
            values.achievements ?? [],
          ],
        );
      await expect(insert({ end: "2020-04-01" })).rejects.toMatchObject({
        constraint: "experiences_dates_ordered",
      });
      await expect(insert({ organization: "  " })).rejects.toMatchObject({
        constraint: "experiences_organization_not_blank",
      });
      await expect(insert({ title: "" })).rejects.toMatchObject({
        constraint: "experiences_title_not_blank",
      });
      await expect(insert({ description: " " })).rejects.toMatchObject({
        constraint: "experiences_description_not_blank",
      });
      await expect(
        insert({ achievements: Array.from({ length: 11 }, (_, i) => `l${i}`) }),
      ).rejects.toMatchObject({ constraint: "experiences_achievements_max" });
    });
  },
);
