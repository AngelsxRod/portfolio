import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MARK_DOT, MARK_K_PATH, MARK_K_TRANSFORM, markSvg } from "./brand";

const read = (path: string) =>
  readFileSync(join(__dirname, "../../..", path), "utf8");

describe("isotipo", () => {
  it.each(["public/brand/mark.svg", "src/app/icon.svg"])(
    "%s usa la misma geometría que el componente",
    (path) => {
      const svg = read(path);
      expect(svg).toContain(MARK_K_PATH);
      expect(svg).toContain(MARK_K_TRANSFORM);
      expect(svg).toContain(`cx="${MARK_DOT.cx}"`);
    },
  );

  it("genera un SVG autónomo para usarlo como imagen", () => {
    const svg = markSvg();
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(
      true,
    );
    expect(svg).toContain(MARK_K_PATH);
  });
});
