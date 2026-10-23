import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HttpException, UnauthorizedException } from "@nestjs/common";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { randomBytes } from "node:crypto";
import { AppModule } from "../server.js";
import { AdminSessionService, SESSION_COOKIE } from "../auth/session.js";

const ORIGIN = "http://localhost:3000";
const PROXY_SECRET = "test-proxy-secret-with-at-least-32-characters";

async function createTestApp() {
  const sessions = new Set<string>();
  const sessionService = {
    signIn: async (username: string, password: string) => {
      if (password === "limited")
        throw new HttpException("Try again later", 429);
      if (username !== "admin" || password !== "correct-password") {
        throw new UnauthorizedException("Invalid credentials");
      }
      const token = randomBytes(32).toString("base64url");
      sessions.add(token);
      return token;
    },
    hasSession: async (token: string | null) =>
      Boolean(token && sessions.has(token)),
    signOut: async (token: string | null) => {
      if (token) sessions.delete(token);
    },
  };
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AdminSessionService)
    .useValue(sessionService)
    .compile();
  const app = module.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

describe("admin access", () => {
  let app: NestFastifyApplication;
  const previousOrigin = process.env.WEB_ORIGIN;
  const previousSecret = process.env.ADMIN_PROXY_SECRET;

  beforeEach(async () => {
    process.env.WEB_ORIGIN = ORIGIN;
    process.env.ADMIN_PROXY_SECRET = PROXY_SECRET;
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
    if (previousOrigin === undefined) delete process.env.WEB_ORIGIN;
    else process.env.WEB_ORIGIN = previousOrigin;
    if (previousSecret === undefined) delete process.env.ADMIN_PROXY_SECRET;
    else process.env.ADMIN_PROXY_SECRET = previousSecret;
  });

  async function login(username = "admin", password = "correct-password") {
    return app.inject({
      method: "POST",
      url: "/auth/login",
      headers: { origin: ORIGIN, "x-admin-proxy-secret": PROXY_SECRET },
      payload: { username, password },
    });
  }

  it("denies the private route without a valid session", async () => {
    const missing = await app.inject({ method: "GET", url: "/admin/session" });
    const forged = await app.inject({
      method: "GET",
      url: "/admin/session",
      headers: {
        cookie: `${SESSION_COOKIE}=${randomBytes(32).toString("base64url")}`,
      },
    });
    expect(missing.statusCode).toBe(401);
    expect(forged.statusCode).toBe(401);
  });

  it.each([
    ["GET", "/admin/projects/drafts"],
    ["GET", "/admin/projects/drafts/00000000-0000-4000-8000-000000000001"],
    ["POST", "/admin/projects/drafts"],
    ["PUT", "/admin/projects/drafts/00000000-0000-4000-8000-000000000001"],
    ["GET", "/admin/projects/published"],
    ["POST", "/admin/projects/00000000-0000-4000-8000-000000000001/publish"],
    ["POST", "/admin/projects/00000000-0000-4000-8000-000000000001/unpublish"],
  ] as const)("denies %s %s without an active session", async (method, url) => {
    const missing = await app.inject({
      method,
      url,
      headers: { origin: ORIGIN },
    });
    expect(missing.statusCode).toBe(401);
    const signedIn = await login();
    const cookie = String(signedIn.headers["set-cookie"]).split(";")[0];
    await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: { origin: ORIGIN, cookie },
    });
    const revoked = await app.inject({
      method,
      url,
      headers: { origin: ORIGIN, cookie },
    });
    expect(revoked.statusCode).toBe(401);
  });

  it("permits the admin and revokes access on logout", async () => {
    const signedIn = await login();
    expect(signedIn.statusCode).toBe(200);
    const cookie = signedIn.headers["set-cookie"];
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    const sessionCookie = String(cookie).split(";")[0];

    const allowed = await app.inject({
      method: "GET",
      url: "/admin/session",
      headers: { cookie: sessionCookie },
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json()).toEqual({ authenticated: true });

    const signedOut = await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: { origin: ORIGIN, cookie: sessionCookie },
    });
    expect(signedOut.statusCode).toBe(200);
    expect(signedOut.headers["set-cookie"]).toContain("Max-Age=0");
    const revoked = await app.inject({
      method: "GET",
      url: "/admin/session",
      headers: { cookie: sessionCookie },
    });
    expect(revoked.statusCode).toBe(401);
  });

  it("rejects wrong credentials, malformed data and repeated attempts", async () => {
    expect((await login("admin", "wrong")).statusCode).toBe(401);
    expect((await login("admin", "limited")).statusCode).toBe(429);
    const malformed = await app.inject({
      method: "POST",
      url: "/auth/login",
      headers: { origin: ORIGIN, "x-admin-proxy-secret": PROXY_SECRET },
      payload: { username: "admin", password: 123 },
    });
    expect(malformed.statusCode).toBe(400);
  });

  it("requires the configured origin for session changes", async () => {
    const loginWithoutOrigin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: "admin", password: "correct-password" },
    });
    expect(loginWithoutOrigin.statusCode).toBe(403);
    const loginWithoutProxy = await app.inject({
      method: "POST",
      url: "/auth/login",
      headers: { origin: ORIGIN },
      payload: { username: "admin", password: "correct-password" },
    });
    expect(loginWithoutProxy.statusCode).toBe(403);
    const signedIn = await login();
    const sessionCookie = String(signedIn.headers["set-cookie"]).split(";")[0];
    const logoutFromAnotherOrigin = await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: { origin: "https://other.example", cookie: sessionCookie },
    });
    expect(logoutFromAnotherOrigin.statusCode).toBe(403);
  });
});
