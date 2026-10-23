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
import { eq } from "drizzle-orm";
import { AppModule } from "../server.js";
import { DatabaseService } from "../database.js";
import * as schema from "../db/schema.js";
import { hashPassword } from "../auth/password.js";

// Run against a migrated disposable database, never the portfolio database.
describe.runIf(Boolean(process.env.TEST_DATABASE_URL))(
  "profile HTTP routes",
  () => {
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    const origin = "http://localhost:3000";
    const secret = "prof-test-proxy-secret-at-least-32-characters";
    const previous = { ...process.env };
    let app: NestFastifyApplication;
    let cookie: string;

    beforeAll(async () => {
      process.env.WEB_ORIGIN = origin;
      process.env.ADMIN_PROXY_SECRET = secret;
      process.env.ADMIN_USERNAME = "prof-test-admin";
      process.env.ADMIN_PASSWORD_HASH = await hashPassword(
        "prof-test-password",
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
          username: "prof-test-admin",
          password: "prof-test-password",
        },
      });
      expect(login.statusCode).toBe(200);
      cookie = String(login.headers["set-cookie"]).split(";")[0]!;
    });

    afterAll(async () => {
      await db.delete(schema.profile);
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

    const base = "/admin/profile";
    const valid = {
      displayName: "Persona de prueba",
      presentation: "Presentación de prueba.",
    };

    const reset = () => db.delete(schema.profile);
    const put = (
      body: unknown,
      headers: Record<string, string> = { cookie, origin },
    ) =>
      app.inject({
        method: "PUT",
        url: base,
        headers,
        payload: body as object,
      });
    const post = (
      path: string,
      headers: Record<string, string> = { cookie, origin },
    ) => app.inject({ method: "POST", url: `${base}/${path}`, headers });
    const current = async () =>
      (
        await app.inject({ method: "GET", url: base, headers: { cookie } })
      ).json();
    const publicProfile = () => app.inject({ method: "GET", url: "/profile" });

    it("starts empty: nothing published and no draft", async () => {
      await reset();
      expect(await current()).toEqual({
        draft: null,
        published: null,
        hasUnpublishedChanges: false,
      });
      expect((await publicProfile()).statusCode).toBe(404);
    });

    it("saves a trimmed draft with defaults and retrieves it", async () => {
      await reset();
      const saved = await put({
        displayName: "  Persona  ",
        presentation: " Hola ",
        headline: "  Frontend Developer  ",
        location: "   ",
        email: " a@b.co ",
        links: [{ label: " GitHub ", url: " https://github.com/x " }],
      });
      expect(saved.statusCode).toBe(200);
      expect(saved.headers["cache-control"]).toBe("no-store");
      expect(saved.json().draft).toMatchObject({
        version: "draft",
        displayName: "Persona",
        presentation: "Hola",
        headline: "Frontend Developer",
        location: null,
        email: "a@b.co",
        links: [{ label: "GitHub", url: "https://github.com/x" }],
      });
      expect(saved.json().published).toBeNull();
      expect(saved.json().hasUnpublishedChanges).toBe(true);
      const again = await put(valid);
      expect(again.json().draft).toMatchObject({ email: null, links: [] });
      expect(await db.select().from(schema.profile)).toHaveLength(1);
    });

    it.each([
      [{ presentation: "P" }, "displayName"],
      [{ ...valid, displayName: " " }, "displayName"],
      [{ ...valid, displayName: "x".repeat(121) }, "displayName"],
      [{ ...valid, displayName: 5 }, "displayName"],
      [{ displayName: "N" }, "presentation"],
      [{ ...valid, presentation: "x".repeat(2001) }, "presentation"],
      [{ ...valid, location: "x".repeat(121) }, "location"],
      [{ ...valid, location: 5 }, "location"],
      [{ ...valid, headline: "x".repeat(121) }, "headline"],
      [{ ...valid, headline: 5 }, "headline"],
      [{ ...valid, email: "no-es-correo" }, "email"],
      [{ ...valid, email: "a@b" }, "email"],
      [{ ...valid, email: 5 }, "email"],
      [{ ...valid, links: "uno" }, "links"],
      [{ ...valid, links: [{ label: "", url: "https://a.co" }] }, "links"],
      [
        { ...valid, links: [{ label: "x".repeat(41), url: "https://a.co" }] },
        "links",
      ],
      [
        { ...valid, links: [{ label: "A", url: "javascript:alert(1)" }] },
        "links",
      ],
      [{ ...valid, links: [{ label: "A", url: "https://u:p@a.co" }] }, "links"],
      [{ ...valid, links: [{ label: "A", url: "ftp://a.co" }] }, "links"],
      [
        { ...valid, links: [{ label: "A", url: "https://a.co", extra: 1 }] },
        "links",
      ],
      [{ ...valid, links: ["https://a.co"] }, "links"],
      [
        {
          ...valid,
          links: [
            { label: "A", url: "https://a.co" },
            { label: "B", url: "https://a.co" },
          ],
        },
        "links",
      ],
      [
        {
          ...valid,
          links: Array.from({ length: 11 }, (_, i) => ({
            label: `L${i}`,
            url: `https://a.co/${i}`,
          })),
        },
        "links",
      ],
      [{ ...valid, version: "published" }, "form"],
      [{ ...valid, createdAt: "2020-01-01" }, "form"],
    ])("rejects invalid input %j with a message for %s", async (body, key) => {
      await reset();
      const result = await put(body);
      expect(result.statusCode).toBe(400);
      expect(result.json().fields).toHaveProperty(key);
      expect(await db.select().from(schema.profile)).toHaveLength(0);
    });

    it("rejects a non-object body and reports every missing field", async () => {
      expect((await put([])).statusCode).toBe(400);
      const empty = await put({});
      expect(Object.keys(empty.json().fields).sort()).toEqual([
        "displayName",
        "presentation",
      ]);
    });

    it("keeps the published version until the draft is published again", async () => {
      await reset();
      expect((await post("publish")).statusCode).toBe(400);
      await put({ ...valid, links: [{ label: "Web", url: "https://a.co" }] });
      expect((await publicProfile()).statusCode).toBe(404);

      const published = await post("publish");
      expect(published.statusCode).toBe(200);
      expect(published.json().hasUnpublishedChanges).toBe(false);
      const visible = await publicProfile();
      expect(visible.statusCode).toBe(200);
      expect(visible.headers["cache-control"]).toBe("no-store");
      expect(visible.json()).toEqual({
        displayName: "Persona de prueba",
        headline: null,
        presentation: "Presentación de prueba.",
        location: null,
        email: null,
        links: [{ label: "Web", url: "https://a.co" }],
      });

      const edited = await put({ ...valid, displayName: "Nombre nuevo" });
      expect(edited.json().hasUnpublishedChanges).toBe(true);
      expect((await publicProfile()).json().displayName).toBe(
        "Persona de prueba",
      );

      expect((await post("publish")).json().hasUnpublishedChanges).toBe(false);
      expect((await publicProfile()).json().displayName).toBe("Nombre nuevo");

      const withdrawn = await post("unpublish");
      expect(withdrawn.statusCode).toBe(200);
      expect(withdrawn.json().published).toBeNull();
      expect(withdrawn.json().draft).toMatchObject({
        displayName: "Nombre nuevo",
      });
      expect((await publicProfile()).statusCode).toBe(404);
      expect((await post("unpublish")).statusCode).toBe(404);
    });

    it("denies access without a session or with a missing or foreign origin", async () => {
      await reset();
      for (const [method, url, body] of [
        ["PUT", base, valid],
        ["POST", `${base}/publish`, undefined],
        ["POST", `${base}/unpublish`, undefined],
      ] as const) {
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
      expect((await app.inject({ method: "GET", url: base })).statusCode).toBe(
        401,
      );
      expect(await db.select().from(schema.profile)).toHaveLength(0);
    });

    it("exposes only public fields and enforces constraints in the database", async () => {
      await reset();
      await put({ ...valid, email: "a@b.co" });
      await post("publish");
      const keys = Object.keys((await publicProfile()).json()).sort();
      expect(keys).toEqual([
        "displayName",
        "email",
        "headline",
        "links",
        "location",
        "presentation",
      ]);
      await expect(
        pool.query(
          `insert into profile (version, display_name, presentation, links) values ('draft', ' ', 'p', '[]')`,
        ),
      ).rejects.toMatchObject({
        constraint: expect.stringMatching(
          /profile_(display_name_not_blank|pkey)/,
        ),
      });
      await reset();
      await expect(
        pool.query(
          `insert into profile (version, display_name, presentation, links) values ('draft', 'N', 'p', '{"a":1}')`,
        ),
      ).rejects.toMatchObject({ constraint: "profile_links_array" });
    });
  },
);
