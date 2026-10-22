import "reflect-metadata";
import { describe, expect, it } from "vitest";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { DatabaseService } from "../database.js";
import { AppModule } from "../server.js";

async function createTestApp(
  check: (() => Promise<void>) | null = async () => {},
) {
  const builder = Test.createTestingModule({ imports: [AppModule] });
  if (check) {
    builder.overrideProvider(DatabaseService).useValue({ check });
  }
  const module = await builder.compile();
  const app = module.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

describe("API routes", () => {
  it("GET /status returns 200", async () => {
    const app = await createTestApp();
    try {
      const response = await app.inject({ method: "GET", url: "/status" });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ ok: true });
    } finally {
      await app.close();
    }
  });

  it("GET /message/:name keeps the existing response", async () => {
    const app = await createTestApp();
    try {
      const response = await app.inject({
        method: "GET",
        url: "/message/jared",
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ message: "hello jared" });
    } finally {
      await app.close();
    }
  });

  it("GET /status/db returns 200 when PostgreSQL responds", async () => {
    const app = await createTestApp();
    try {
      const response = await app.inject({ method: "GET", url: "/status/db" });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ ok: true });
    } finally {
      await app.close();
    }
  });

  it("GET /status/db returns 503 when PostgreSQL is unavailable", async () => {
    const app = await createTestApp(async () => {
      throw new Error("Database unavailable");
    });
    try {
      const response = await app.inject({ method: "GET", url: "/status/db" });
      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({ ok: false });
    } finally {
      await app.close();
    }
  });

  it("GET /status/db returns 503 without DATABASE_URL", async () => {
    const previousUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    const app = await createTestApp(null);
    try {
      const response = await app.inject({ method: "GET", url: "/status/db" });
      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({ ok: false });
    } finally {
      await app.close();
      if (previousUrl !== undefined) {
        process.env.DATABASE_URL = previousUrl;
      }
    }
  });
});
