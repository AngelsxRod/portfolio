import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../auth/password.js";

describe("admin password hash", () => {
  it("accepts only the matching password", async () => {
    const encoded = await hashPassword(
      "a long private password",
      randomBytes(32),
    );
    expect(await verifyPassword("a long private password", encoded)).toBe(true);
    expect(await verifyPassword("a different password", encoded)).toBe(false);
    expect(await verifyPassword("a long private password", "invalid")).toBe(
      false,
    );
  });
});
