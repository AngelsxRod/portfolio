import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import {
  MASCOT_KEY,
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

  it("cada frase existe en los mensajes de ambos idiomas", () => {
    const paths = [
      "/projects",
      "/projects/x",
      "/experiencia",
      "/educacion",
      "/contacto",
    ];
    for (const messages of [es, en]) {
      expect(messages.mascot.hidden).toBeTruthy();
      for (const path of paths)
        for (const key of mascotPhrases(path))
          expect(
            (messages.mascot as Record<string, unknown>)[key.split(".")[0]!],
          ).toHaveProperty(key.split(".")[1]!);
    }
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
