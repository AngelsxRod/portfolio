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
    });

    afterAll(async () => {
      if (ids.length)
        await db.delete(schema.skills).where(inArray(schema.skills.id, ids));
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

    function payload() {
      return {
        name: `Habilidad ${randomUUID()}`,
        category: "Categoría de prueba",
        position: 0,
      };
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
      const result = await app.inject({ method: "GET", url: "/skills" });
      expect(result.statusCode).toBe(200);
      expect(result.headers["cache-control"]).toBe("no-store");
      return (result.json() as { name: string }[]).map((skill) => skill.name);
    }

    it("persists a trimmed draft and retrieves it", async () => {
      const body = payload();
      const created = await create({
        ...body,
        name: `  ${body.name}  `,
        category: "  Categoría  ",
      });
      expect(created.statusCode).toBe(201);
      expect(created.json()).toMatchObject({
        name: body.name,
        category: "Categoría",
        position: 0,
        status: "draft",
      });
      const { id } = created.json();
      const found = await app.inject({
        method: "GET",
        url: `/admin/skills/${id}`,
        headers: { cookie },
      });
      expect(found.statusCode).toBe(200);
      expect(found.headers["cache-control"]).toBe("no-store");
      expect(found.json()).toMatchObject({ id, name: body.name });
      const list = await app.inject({
        method: "GET",
        url: "/admin/skills",
        headers: { cookie },
      });
      expect(list.json().map((skill: { id: string }) => skill.id)).toContain(
        id,
      );
    });

    it("defaults the position to 0 and edits a draft", async () => {
      const body = payload();
      const created = await create({ name: body.name, category: "Uno" });
      expect(created.json().position).toBe(0);
      const { id, updatedAt } = created.json();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const edited = await write("PUT", `/admin/skills/${id}`, {
        name: body.name,
        category: "Dos",
        position: 3,
      });
      expect(edited.statusCode).toBe(200);
      expect(edited.json()).toMatchObject({ category: "Dos", position: 3 });
      expect(new Date(edited.json().updatedAt).getTime()).toBeGreaterThan(
        new Date(updatedAt).getTime(),
      );
    });

    it.each([
      [{ name: "", category: "x" }, "name"],
      [{ name: "   ", category: "x" }, "name"],
      [{ name: "x".repeat(81), category: "x" }, "name"],
      [{ name: 5, category: "x" }, "name"],
      [{ category: "x" }, "name"],
      [{ name: "x", category: "" }, "category"],
      [{ name: "x", category: "x".repeat(81) }, "category"],
      [{ name: "x" }, "category"],
      [{ name: "x", category: "x", position: -1 }, "position"],
      [{ name: "x", category: "x", position: 1.5 }, "position"],
      [{ name: "x", category: "x", position: "1" }, "position"],
      [{ name: "x", category: "x", position: 2147483648 }, "position"],
      [{ name: "x", category: "x", status: "published" }, "form"],
      [{ name: "x", category: "x", level: 90 }, "form"],
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
        category: "Otra",
      });
      expect(duplicate.statusCode).toBe(409);
      expect(duplicate.json().fields).toHaveProperty("name");
      const other = await create(payload());
      const clash = await write("PUT", `/admin/skills/${other.json().id}`, {
        name: body.name.toLowerCase(),
        category: "x",
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
      const publicList = await app.inject({ method: "GET", url: "/skills" });
      expect(
        publicList.json().find((skill: { id: string }) => skill.id === id),
      ).toEqual({
        id,
        name: body.name,
        category: body.category,
        position: 0,
      });

      // A published skill must be withdrawn before it can be edited or republished.
      expect(
        (await write("PUT", `/admin/skills/${id}`, payload())).statusCode,
      ).toBe(404);
      expect(
        (await write("POST", `/admin/skills/${id}/publish`)).statusCode,
      ).toBe(404);

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
        await app.inject({ method: "GET", url: "/skills" })
      ).json() as { id: string }[];
      const found = result
        .map((skill) => skill.id)
        .filter((id) =>
          [first, second, hidden].some((s) => s.json().id === id),
        );
      expect(found).toEqual([second.json().id, first.json().id]);
      expect(JSON.stringify(result)).not.toContain("status");
    });
  },
);
