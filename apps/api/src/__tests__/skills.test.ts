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
  "skill HTTP routes",
  () => {
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    const origin = "http://localhost:3000";
    const secret = "skill-test-proxy-secret-at-least-32-characters";
    const ids: string[] = [];
    const categoryIds: string[] = [];
    let categoryId: string;
    const previous = { ...process.env };
    let app: NestFastifyApplication;
    let cookie: string;

    beforeAll(async () => {
      process.env.WEB_ORIGIN = origin;
      process.env.ADMIN_PROXY_SECRET = secret;
      process.env.ADMIN_USERNAME = "skill-test-admin";
      process.env.ADMIN_PASSWORD_HASH = await hashPassword(
        "skill-test-password",
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
          username: "skill-test-admin",
          password: "skill-test-password",
        },
      });
      expect(login.statusCode).toBe(200);
      cookie = String(login.headers["set-cookie"]).split(";")[0]!;
      categoryId = await createCategory(`Categoría ${randomUUID()}`);
    });

    afterAll(async () => {
      if (ids.length)
        await db.delete(schema.skills).where(inArray(schema.skills.id, ids));
      if (categoryIds.length)
        await db
          .delete(schema.skillCategories)
          .where(inArray(schema.skillCategories.id, categoryIds));
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

    async function createCategory(name: string, position = 0) {
      const result = await app.inject({
        method: "POST",
        url: "/admin/skill-categories",
        headers: { cookie, origin },
        payload: { name, position },
      });
      expect(result.statusCode).toBe(201);
      categoryIds.push(result.json().id);
      return result.json().id as string;
    }

    function payload() {
      return { name: `Habilidad ${randomUUID()}`, categoryId, position: 0 };
    }

    async function create(body: unknown = payload()) {
      const result = await app.inject({
        method: "POST",
        url: "/admin/skills",
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

    async function publicNames() {
      const result = await app.inject({
        method: "GET",
        url: "/skills?pageSize=100",
      });
      expect(result.statusCode).toBe(200);
      expect(result.headers["cache-control"]).toBe("no-store");
      return (result.json().items as { name: string }[]).map(
        (skill) => skill.name,
      );
    }

    it("paginates the admin and public lists with a stable envelope", async () => {
      const categoryIdForPage = categoryId;
      for (let i = 0; i < 3; i++) {
        const made = await create({
          ...payload(),
          categoryId: categoryIdForPage,
        });
        expect(made.statusCode).toBe(201);
        await write("POST", `/admin/skills/${made.json().id}/publish`);
      }
      const first = await app.inject({
        method: "GET",
        url: "/admin/skills?page=1&pageSize=2",
        headers: { cookie },
      });
      expect(first.statusCode).toBe(200);
      const body = first.json();
      expect(body.items).toHaveLength(2);
      expect(body).toMatchObject({ page: 1, pageSize: 2 });
      expect(body.total).toBeGreaterThanOrEqual(3);
      expect(body.totalPages).toBe(Math.ceil(body.total / 2));
      const second = (
        await app.inject({
          method: "GET",
          url: "/admin/skills?page=2&pageSize=2",
          headers: { cookie },
        })
      ).json();
      const firstIds = body.items.map((item: { id: string }) => item.id);
      expect(
        second.items.some((item: { id: string }) => firstIds.includes(item.id)),
      ).toBe(false);
      const beyond = (
        await app.inject({
          method: "GET",
          url: "/skills?page=99999&pageSize=10",
        })
      ).json();
      expect(beyond.items).toEqual([]);
      expect(beyond.total).toBeGreaterThanOrEqual(3);
    });

    it("rejects invalid pagination parameters", async () => {
      for (const query of [
        "page=0",
        "page=-1",
        "page=abc",
        "pageSize=0",
        "pageSize=101",
        "pageSize=1.5",
      ]) {
        const result = await app.inject({
          method: "GET",
          url: `/skills?${query}`,
        });
        expect(result.statusCode, query).toBe(400);
        expect(Object.keys(result.json().fields)).toHaveLength(1);
      }
    });

    it("persists a trimmed draft and retrieves it", async () => {
      const body = payload();
      const created = await create({ ...body, name: `  ${body.name}  ` });
      expect(created.statusCode).toBe(201);
      expect(created.json()).toMatchObject({
        name: body.name,
        categoryId,
        position: 0,
        status: "draft",
      });
      expect(created.json().category).toMatch(/^Categoría /);
      const { id } = created.json();
      const found = await app.inject({
        method: "GET",
        url: `/admin/skills/${id}`,
        headers: { cookie },
      });
      expect(found.statusCode).toBe(200);
      expect(found.headers["cache-control"]).toBe("no-store");
      expect(found.json()).toMatchObject({ id, name: body.name, categoryId });
      const list = await app.inject({
        method: "GET",
        url: "/admin/skills?pageSize=100",
        headers: { cookie },
      });
      expect(
        list.json().items.map((skill: { id: string }) => skill.id),
      ).toContain(id);
    });

    it("defaults the position to 0 and edits a draft", async () => {
      const body = payload();
      const created = await create({ name: body.name, categoryId });
      expect(created.json().position).toBe(0);
      const { id, updatedAt } = created.json();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const other = await createCategory(`Otra ${randomUUID()}`);
      const edited = await write("PUT", `/admin/skills/${id}`, {
        name: body.name,
        categoryId: other,
        position: 3,
      });
      expect(edited.statusCode).toBe(200);
      expect(edited.json()).toMatchObject({ categoryId: other, position: 3 });
      expect(new Date(edited.json().updatedAt).getTime()).toBeGreaterThan(
        new Date(updatedAt).getTime(),
      );
    });

    const unknownCategory = "00000000-0000-4000-8000-0000000000aa";
    it.each([
      [{ name: "", categoryId: unknownCategory }, "name"],
      [{ name: "   ", categoryId: unknownCategory }, "name"],
      [{ name: "x".repeat(81), categoryId: unknownCategory }, "name"],
      [{ name: 5, categoryId: unknownCategory }, "name"],
      [{ categoryId: unknownCategory }, "name"],
      [{ name: "x" }, "categoryId"],
      [{ name: "x", categoryId: "" }, "categoryId"],
      [{ name: "x", categoryId: 5 }, "categoryId"],
      [{ name: "x", categoryId: "no-es-uuid" }, "categoryId"],
      [{ name: "x", categoryId: unknownCategory }, "categoryId"],
      [
        { name: "x", category: "texto libre", categoryId: unknownCategory },
        "form",
      ],
      [{ name: "x", categoryId: unknownCategory, position: -1 }, "position"],
      [{ name: "x", categoryId: unknownCategory, position: 1.5 }, "position"],
      [{ name: "x", categoryId: unknownCategory, position: "1" }, "position"],
      [
        { name: "x", categoryId: unknownCategory, position: 2147483648 },
        "position",
      ],
      [{ name: "x", categoryId: unknownCategory, status: "published" }, "form"],
      [{ name: "x", categoryId: unknownCategory, level: 90 }, "form"],
    ])("rejects invalid input %j with a message for %s", async (body, key) => {
      const result = await create(body);
      expect(result.statusCode).toBe(400);
      expect(result.json().fields).toHaveProperty(key);
    });

    it("rejects a non-object body and malformed ids", async () => {
      expect((await create([])).statusCode).toBe(400);
      for (const method of ["GET", "PUT", "POST"] as const) {
        const url =
          method === "POST"
            ? "/admin/skills/no-es-uuid/publish"
            : "/admin/skills/no-es-uuid";
        const result = await app.inject({
          method,
          url,
          headers: { cookie, origin },
          payload: method === "GET" ? undefined : payload(),
        });
        expect(result.statusCode).toBe(400);
      }
    });

    it("rejects duplicate names regardless of case with a 409", async () => {
      const body = payload();
      expect((await create(body)).statusCode).toBe(201);
      const duplicate = await create({
        ...body,
        name: body.name.toUpperCase(),
      });
      expect(duplicate.statusCode).toBe(409);
      expect(duplicate.json().fields).toHaveProperty("name");
      const other = await create(payload());
      const clash = await write("PUT", `/admin/skills/${other.json().id}`, {
        name: body.name.toLowerCase(),
        categoryId,
      });
      expect(clash.statusCode).toBe(409);
    });

    it("returns 404 for unknown skills", async () => {
      const id = randomUUID();
      expect(
        (
          await app.inject({
            method: "GET",
            url: `/admin/skills/${id}`,
            headers: { cookie },
          })
        ).statusCode,
      ).toBe(404);
      expect(
        (await write("PUT", `/admin/skills/${id}`, payload())).statusCode,
      ).toBe(404);
      expect(
        (await write("POST", `/admin/skills/${id}/publish`)).statusCode,
      ).toBe(404);
      expect(
        (await write("POST", `/admin/skills/${id}/unpublish`)).statusCode,
      ).toBe(404);
    });

    it("denies writes without a session or with a missing or foreign origin", async () => {
      const created = await create();
      const { id } = created.json();
      const requests = [
        ["POST", "/admin/skills", payload()],
        ["PUT", `/admin/skills/${id}`, payload()],
        ["POST", `/admin/skills/${id}/publish`, undefined],
        ["POST", `/admin/skills/${id}/unpublish`, undefined],
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
        (await app.inject({ method: "GET", url: `/admin/skills/${id}` }))
          .statusCode,
      ).toBe(401);
      expect(
        (await app.inject({ method: "GET", url: "/admin/skills" })).statusCode,
      ).toBe(401);
      const unchanged = await app.inject({
        method: "GET",
        url: `/admin/skills/${id}`,
        headers: { cookie },
      });
      expect(unchanged.json().status).toBe("draft");
    });

    it("moves a skill through draft, published and withdrawn", async () => {
      const body = payload();
      const { id, updatedAt } = (await create(body)).json();
      expect(await publicNames()).not.toContain(body.name);

      await new Promise((resolve) => setTimeout(resolve, 10));
      const published = await write("POST", `/admin/skills/${id}/publish`);
      expect(published.statusCode).toBe(200);
      expect(published.json().status).toBe("published");
      expect(new Date(published.json().updatedAt).getTime()).toBeGreaterThan(
        new Date(updatedAt).getTime(),
      );
      const publicList = await app.inject({
        method: "GET",
        url: "/skills?pageSize=100",
      });
      expect(
        publicList
          .json()
          .items.find((skill: { id: string }) => skill.id === id),
      ).toEqual({
        id,
        name: body.name,
        categoryId,
        category: expect.stringMatching(/^Categoría /),
        position: 0,
      });

      // Editing a published skill keeps the public version and stores pending changes.
      expect(
        (await write("POST", `/admin/skills/${id}/publish`)).statusCode,
      ).toBe(404);
      const edited = await write("PUT", `/admin/skills/${id}`, {
        ...payload(),
        name: "Cambio pendiente",
      });
      expect(edited.statusCode).toBe(200);
      expect(edited.json().status).toBe("published");
      expect(edited.json().name).toBe(body.name);
      expect(edited.json().pending.name).toBe("Cambio pendiente");
      const live = await app.inject({
        method: "GET",
        url: "/skills?pageSize=100",
      });
      const liveSkill = live
        .json()
        .items.find((skill: { id: string }) => skill.id === id);
      expect(liveSkill.name).toBe(body.name);
      expect("pending" in liveSkill).toBe(false);

      const discarded = await write("POST", `/admin/skills/${id}/discard`);
      expect(discarded.statusCode).toBe(200);
      expect(discarded.json().pending).toBeNull();
      expect(
        (await write("POST", `/admin/skills/${id}/discard`)).statusCode,
      ).toBe(404);

      const nextName = `Versión nueva ${randomUUID()}`;
      await write("PUT", `/admin/skills/${id}`, {
        ...payload(),
        name: nextName,
      });
      const applied = await write("POST", `/admin/skills/${id}/publish`);
      expect(applied.statusCode).toBe(200);
      expect(applied.json().name).toBe(nextName);
      expect(applied.json().pending).toBeNull();
      expect(await publicNames()).toContain(nextName);

      await new Promise((resolve) => setTimeout(resolve, 10));
      const withdrawn = await write("POST", `/admin/skills/${id}/unpublish`);
      expect(withdrawn.statusCode).toBe(200);
      expect(withdrawn.json().status).toBe("draft");
      expect(await publicNames()).not.toContain(body.name);
      expect(
        (await write("POST", `/admin/skills/${id}/unpublish`)).statusCode,
      ).toBe(404);
      expect(
        (await write("PUT", `/admin/skills/${id}`, payload())).statusCode,
      ).toBe(200);
    });

    it("lists only published skills publicly, ordered by position", async () => {
      const first = await create({ ...payload(), position: 20 });
      const second = await create({ ...payload(), position: 10 });
      const hidden = await create({ ...payload(), position: 0 });
      for (const created of [first, second])
        await write("POST", `/admin/skills/${created.json().id}/publish`);
      const result = (
        await app.inject({ method: "GET", url: "/skills?pageSize=100" })
      ).json().items as { id: string }[];
      const found = result
        .map((skill) => skill.id)
        .filter((id) =>
          [first, second, hidden].some((s) => s.json().id === id),
        );
      expect(found).toEqual([second.json().id, first.json().id]);
      expect(JSON.stringify(result)).not.toContain("status");
    });

    it("orders public skills by category position before skill position", async () => {
      const later = await createCategory(`Z ${randomUUID()}`, 900);
      const earlier = await createCategory(`A ${randomUUID()}`, 800);
      const inLater = await create({
        ...payload(),
        categoryId: later,
        position: 0,
      });
      const inEarlier = await create({
        ...payload(),
        categoryId: earlier,
        position: 50,
      });
      for (const created of [inLater, inEarlier])
        await write("POST", `/admin/skills/${created.json().id}/publish`);
      const result = (
        await app.inject({ method: "GET", url: "/skills?pageSize=100" })
      ).json().items as { id: string }[];
      const found = result
        .map((skill) => skill.id)
        .filter((id) => [inLater, inEarlier].some((s) => s.json().id === id));
      expect(found).toEqual([inEarlier.json().id, inLater.json().id]);
    });
  },
);
