import { describe, expect, it } from "vitest";
import {
  MASCOT_KEY,
  hiddenWindowsPhrase,
  mascotEnabled,
  mascotPhrases,
  mascotVisibleOn,
  pickPhrase,
  saveMascotEnabled,
} from "./mascot";

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

describe("mascota", () => {
  it("solo aparece donde el avatar grande no está ya", () => {
    expect(mascotVisibleOn("/")).toBe(false);
    expect(mascotVisibleOn("/sobre-mi")).toBe(false);
    expect(mascotVisibleOn("/ruta-que-no-existe")).toBe(false);
    for (const path of [
      "/projects",
      "/projects/x",
      "/experiencia",
      "/educacion",
      "/contacto",
    ])
      expect(mascotVisibleOn(path)).toBe(true);
  });

  it("tiene frases para cada página donde aparece", () => {
    for (const path of [
      "/projects",
      "/projects/x",
      "/experiencia",
      "/educacion",
      "/contacto",
    ])
      expect(mascotPhrases(path).length).toBeGreaterThan(0);
    expect(mascotPhrases("/projects/x")).not.toEqual(
      mascotPhrases("/projects"),
    );
    expect(mascotPhrases("/")).toEqual([]);
  });

  it("avisa de las ventanas guardadas", () => {
    expect(hiddenWindowsPhrase(0)).toBeNull();
    expect(hiddenWindowsPhrase(1)).toContain("1 ventana guardada");
    expect(hiddenWindowsPhrase(3)).toContain("3 ventanas guardadas");
  });

  it("da la vuelta a la lista de frases", () => {
    expect(pickPhrase(["a", "b"], 0)).toBe("a");
    expect(pickPhrase(["a", "b"], 3)).toBe("b");
    expect(pickPhrase([], 2)).toBe("");
  });

  it("recuerda si se ocultó y está activa por defecto", () => {
    const storage = memoryStorage();
    expect(mascotEnabled(() => storage)).toBe(true);
    saveMascotEnabled(false, () => storage);
    expect(storage.getItem(MASCOT_KEY)).toBe("off");
    expect(mascotEnabled(() => storage)).toBe(false);
    saveMascotEnabled(true, () => storage);
    expect(mascotEnabled(() => storage)).toBe(true);
  });

  it("no rompe sin almacenamiento", () => {
    expect(mascotEnabled(throwing)).toBe(true);
    expect(mascotEnabled(() => undefined)).toBe(true);
    expect(() => saveMascotEnabled(false, throwing)).not.toThrow();
  });
});
