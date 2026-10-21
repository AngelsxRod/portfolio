import supertest from "supertest";
import { describe, it, expect } from "@jest/globals";
import { createServer } from "../server";

describe("server", () => {
  it("status check returns 200", async () => {
    await supertest(createServer())
      .get("/status")
      .expect(200)
      .then((res) => {
        expect(res.body.ok).toBe(true);
      });
  });

  it("message endpoint says hello", async () => {
    await supertest(createServer())
      .get("/message/jared")
      .expect(200)
      .then((res) => {
        expect(res.body.message).toBe("hello jared");
      });
  });

  it("reports when the database is not configured", async () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      await supertest(createServer())
        .get("/status/db")
        .expect(503)
        .then((res) => {
          expect(res.body.ok).toBe(false);
        });
    } finally {
      if (originalDatabaseUrl) {
        process.env.DATABASE_URL = originalDatabaseUrl;
      }
    }
  });
});
