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
  "skill category HTTP routes",
  () => {
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    const origin = "http://localhost:3000";
    const secret = "category-test-proxy-secret-at-least-32-characters";
    const categoryIds: string[] = [];
    const skillIds: string[] = [];
    const previous = { ...process.env };
    let app: NestFastifyApplication;
    let cookie: string;

    beforeAll(async () => {
      process.env.WEB_ORIGIN = origin;
      process.env.ADMIN_PROXY_SECRET = secret;
      process.env.ADMIN_USERNAME = "category-test-admin";
      process.env.ADMIN_PASSWORD_HASH = await hashPassword(
        "category-test-password",
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
          username: "category-test-admin",
          password: "category-test-password",
        },
      });
      expect(login.statusCode).toBe(200);
      cookie = String(login.headers["set-cookie"]).split(";")[0]!;
    });

    afterAll(async () => {
      if (skillIds.length)
        await db
          .delete(schema.skills)
          .where(inArray(schema.skills.id, skillIds));
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

    function create(body: unknown) {
      return app.inject({
        method: "POST",
        url: "/admin/skill-categories",
        headers: { cookie, origin },
        payload: body as object,
      });
    }

    async function created(name = `Categoría ${randomUUID()}`, position = 0) {
      const result = await create({ name, position });
      expect(result.statusCode).toBe(201);
      categoryIds.push(result.json().id);
      return result.json() as { id: string; name: string };
    }

    it("persists a trimmed category with its skill count", async () => {
      const name = `Categoría ${randomUUID()}`;
      const result = await create({ name: `  ${name}  ` });
      expect(result.statusCode).toBe(201);
      categoryIds.push(result.json().id);
      expect(result.json()).toMatchObject({ name, position: 0, skillCount: 0 });
      const found = await app.inject({
        method: "GET",
        url: `/admin/skill-categories/${result.json().id}`,
        headers: { cookie },
      });
      expect(found.headers["cache-control"]).toBe("no-store");
      expect(found.json().name).toBe(name);
      const list = await app.inject({
        method: "GET",
        url: "/admin/skill-categories?pageSize=100",
        headers: { cookie },
      });
      expect(list.json().items.map((c: { id: string }) => c.id)).toContain(
        result.json().id,
      );
    });

    it("renames a category and keeps its skills linked", async () => {
      const category = await created();
      const skill = await app.inject({
        method: "POST",
        url: "/admin/skills",
        headers: { cookie, origin },
        payload: { name: `Habilidad ${randomUUID()}`, categoryId: category.id },
      });
      expect(skill.statusCode).toBe(201);
      skillIds.push(skill.json().id);
      const renamed = `Renombrada ${randomUUID()}`;
      const edited = await app.inject({
        method: "PUT",
        url: `/admin/skill-categories/${category.id}`,
        headers: { cookie, origin },
        payload: { name: renamed, position: 4 },
      });
      expect(edited.statusCode).toBe(200);
      expect(edited.json()).toMatchObject({
        name: renamed,
        position: 4,
        skillCount: 1,
      });
      const after = await app.inject({
        method: "GET",
        url: `/admin/skills/${skill.json().id}`,
        headers: { cookie },
      });
      expect(after.json()).toMatchObject({
        categoryId: category.id,
        category: renamed,
      });
    });

    it.each([
      [{ name: "" }, "name"],
      [{ name: "   " }, "name"],
      [{ name: "x".repeat(81) }, "name"],
      [{ name: 5 }, "name"],
      [{}, "name"],
      [{ name: "x", position: -1 }, "position"],
      [{ name: "x", position: 1.5 }, "position"],
      [{ name: "x", position: "1" }, "position"],
      [{ name: "x", slug: "x" }, "form"],
    ])("rejects invalid input %j with a message for %s", async (body, key) => {
      const result = await create(body);
      expect(result.statusCode).toBe(400);
      expect(result.json().fields).toHaveProperty(key);
    });

    it("rejects malformed ids and unknown categories", async () => {
      for (const method of ["GET", "PUT"] as const) {
        const result = await app.inject({
          method,
          url: "/admin/skill-categories/no-es-uuid",
          headers: { cookie, origin },
          payload: method === "PUT" ? { name: "x" } : undefined,
        });
        expect(result.statusCode).toBe(400);
      }
      const id = randomUUID();
      expect(
        (
          await app.inject({
            method: "GET",
            url: `/admin/skill-categories/${id}`,
            headers: { cookie },
          })
        ).statusCode,
      ).toBe(404);
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/admin/skill-categories/${id}`,
            headers: { cookie, origin },
            payload: { name: "x" },
          })
        ).statusCode,
      ).toBe(404);
    });

    it("rejects duplicate names regardless of case with a 409", async () => {
      const category = await created();
      const duplicate = await create({ name: category.name.toUpperCase() });
      expect(duplicate.statusCode).toBe(409);
      expect(duplicate.json().fields).toHaveProperty("name");
      const other = await created();
      const clash = await app.inject({
        method: "PUT",
        url: `/admin/skill-categories/${other.id}`,
        headers: { cookie, origin },
        payload: { name: category.name.toLowerCase() },
      });
      expect(clash.statusCode).toBe(409);
    });

    it("denies access without a session or with a bad origin", async () => {
      const category = await created();
      for (const [method, url, payload] of [
        ["POST", "/admin/skill-categories", { name: "x" }],
        ["PUT", `/admin/skill-categories/${category.id}`, { name: "x" }],
      ] as const) {
        expect(
          (await app.inject({ method, url, headers: { origin }, payload }))
            .statusCode,
        ).toBe(401);
        for (const headers of [
          { cookie },
          { cookie, origin: "https://evil.example" },
        ])
          expect(
            (await app.inject({ method, url, headers, payload })).statusCode,
          ).toBe(403);
      }
      for (const url of [
        "/admin/skill-categories",
        `/admin/skill-categories/${category.id}`,
      ])
        expect((await app.inject({ method: "GET", url })).statusCode).toBe(401);
      const unchanged = await app.inject({
        method: "GET",
        url: `/admin/skill-categories/${category.id}`,
        headers: { cookie },
      });
      expect(unchanged.json().name).toBe(category.name);
    });

    it("blocks deleting a category that still has skills", async () => {
      const category = await created();
      const skill = await app.inject({
        method: "POST",
        url: "/admin/skills",
        headers: { cookie, origin },
        payload: { name: `Habilidad ${randomUUID()}`, categoryId: category.id },
      });
      skillIds.push(skill.json().id);
      await expect(
        db
          .delete(schema.skillCategories)
          .where(eq(schema.skillCategories.id, category.id)),
      ).rejects.toThrow();
    });
  },
);
