import { describe, expect, it } from "vitest";
import {
  eyes,
  gazeDirection,
  gazeOffset,
  moodShapes,
  type AvatarMood,
} from "./avatar";

describe("mirada del avatar", () => {
  it("en reposo no desplaza las pupilas", () => {
    expect(gazeOffset(eyes.left, 0, 0)).toEqual({ dx: 0, dy: 0 });
    expect(gazeOffset(eyes.right, 0, 0)).toEqual({ dx: 0, dy: 0 });
  });

  it("al mirar a la izquierda recorre el ojo sin salirse de él", () => {
    const { dx } = gazeOffset(eyes.left, -1, 0);
    expect(eyes.left.pupil.x + dx).toBe(eyes.left.box.x);
    expect(eyes.right.pupil.x + gazeOffset(eyes.right, -1, 0).dx).toBe(
      eyes.right.box.x,
    );
  });

  it("al mirar a la derecha solo cede un píxel de margen", () => {
    expect(gazeOffset(eyes.left, 1, 0).dx).toBe(1);
  });

  it("satura valores fuera de rango", () => {
    expect(gazeOffset(eyes.left, -9, 9)).toEqual(gazeOffset(eyes.left, -1, 1));
  });

  it("normaliza el vector hacia el cursor", () => {
    expect(gazeDirection(0, 0)).toEqual({ nx: 0, ny: 0 });
    expect(gazeDirection(1000, -1000)).toEqual({ nx: 1, ny: -1 });
    expect(gazeDirection(110, 0, 220).nx).toBeCloseTo(0.5);
  });
});

describe("expresiones", () => {
  const moods: AvatarMood[] = [
    "idle",
    "happy",
    "surprised",
    "worried",
    "confused",
  ];

  it("define todas las expresiones y solo la de reposo queda vacía", () => {
    for (const mood of moods) {
      expect(moodShapes[mood]).toBeDefined();
      expect(moodShapes[mood].length > 0).toBe(mood !== "idle");
    }
  });

  it("todos los trazos caen dentro del lienzo de 256×256", () => {
    for (const mood of moods)
      for (const shape of moodShapes[mood]) {
        expect(shape.x).toBeGreaterThanOrEqual(0);
        expect(shape.y).toBeGreaterThanOrEqual(0);
        expect(shape.x + shape.w).toBeLessThanOrEqual(256);
        expect(shape.y + shape.h).toBeLessThanOrEqual(256);
      }
  });
});
