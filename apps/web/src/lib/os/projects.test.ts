import { describe, expect, it } from "vitest";
import {
  ALL_FILTER,
  matchesFilter,
  projectFilters,
  projectHost,
  projectPreview,
} from "./projects";

const image = (id: string) => ({
  id,
  projectId: "p",
  mimeType: "image/png",
  altText: id,
  isFeatured: false,
  createdAt: "",
  updatedAt: "",
});

describe("projectFilters", () => {
  it("solo ofrece «Todos» cuando ningún proyecto tiene tipo", () => {
    expect(
      projectFilters([{ projectType: null }, { projectType: "  " }]),
    ).toEqual([{ value: ALL_FILTER, label: "Todos", count: 2 }]);
  });

  it("agrega los tipos existentes con su recuento en orden de aparición", () => {
    expect(
      projectFilters([
        { projectType: "Sitio web" },
        { projectType: "Landing" },
        { projectType: "Sitio web " },
        { projectType: null },
      ]),
    ).toEqual([
      { value: ALL_FILTER, label: "Todos", count: 4 },
      { value: "Sitio web", label: "Sitio web", count: 2 },
      { value: "Landing", label: "Landing", count: 1 },
    ]);
  });

  it("filtra por tipo y deja pasar todos con «Todos»", () => {
    expect(matchesFilter({ projectType: "Landing" }, ALL_FILTER)).toBe(true);
    expect(matchesFilter({ projectType: "Landing" }, "Landing")).toBe(true);
    expect(matchesFilter({ projectType: null }, "Landing")).toBe(false);
  });
});

describe("projectPreview", () => {
  it("prefiere la destacada, luego la primera y si no hay devuelve null", () => {
    const media = [image("a"), image("b")];
    expect(projectPreview({ media, featuredMediaId: "b" })?.id).toBe("b");
    expect(projectPreview({ media, featuredMediaId: null })?.id).toBe("a");
    expect(projectPreview({ media: [], featuredMediaId: null })).toBeNull();
  });
});

describe("projectHost", () => {
  it("muestra el host sin www y rechaza URL inseguras", () => {
    expect(projectHost("https://www.elmaster502.com/servicios")).toBe(
      "elmaster502.com",
    );
    expect(projectHost("javascript:alert(1)")).toBeNull();
    expect(projectHost(null)).toBeNull();
  });
});
