import { describe, expect, it } from "vitest";
import { BOOT_KEY, bootSeen, markBootSeen } from "./boot";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

const throwing = () => {
  throw new Error("SecurityError");
};

describe("arranque", () => {
  it("se muestra la primera vez y no después de marcarlo", () => {
    const storage = memoryStorage();
    expect(bootSeen(() => storage)).toBe(false);
    markBootSeen(() => storage);
    expect(storage.getItem(BOOT_KEY)).toBe("1");
    expect(bootSeen(() => storage)).toBe(true);
  });

  it("no rompe ni repite el arranque sin almacenamiento", () => {
    expect(bootSeen(throwing)).toBe(true);
    expect(bootSeen(() => undefined)).toBe(true);
    expect(() => markBootSeen(throwing)).not.toThrow();
  });
});
