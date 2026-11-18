import { describe, expect, it } from "vitest";
import {
  ALL_FILTER,
  matchesFilter,
  projectFilters,
  projectHost,
  projectPreview,
  splitNotesSections,
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

  it("agrega los tipos con al menos dos proyectos, en orden de aparición", () => {
    expect(
      projectFilters([
        { projectType: "Landing" },
        { projectType: "Sitio web" },
        { projectType: "Landing" },
        { projectType: "Sistema" },
        { projectType: "Sitio web " },
        { projectType: null },
      ]),
    ).toEqual([
      { value: ALL_FILTER, label: "Todos", count: 6 },
      { value: "Landing", label: "Landing", count: 2 },
      { value: "Sitio web", label: "Sitio web", count: 2 },
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

describe("splitNotesSections", () => {
  it("deja todo como introducción si no hay encabezados", () => {
    expect(splitNotesSections("Hola\n\n- uno")).toEqual({
      intro: { heading: null, body: "Hola\n\n- uno" },
      sections: [],
    });
  });

  it("usa la primera sección con encabezado como introducción", () => {
    const result = splitNotesSections(
      "# Sobre el proyecto\nTexto.\n\n# Qué incluye\n- a\n\n## Cómo está pensado\n- b",
    );
    expect(result.intro).toEqual({
      heading: "Sobre el proyecto",
      body: "Texto.",
    });
    expect(result.sections).toEqual([
      { heading: "Qué incluye", body: "- a" },
      { heading: "Cómo está pensado", body: "- b" },
    ]);
  });

  it("toma el texto previo al primer encabezado como introducción", () => {
    const result = splitNotesSections("Resumen.\n\n# Detalle\nMás.");
    expect(result.intro).toEqual({ heading: null, body: "Resumen." });
    expect(result.sections).toEqual([{ heading: "Detalle", body: "Más." }]);
  });

  it("ignora los encabezados dentro de bloques de código", () => {
    const result = splitNotesSections(
      "# Uso\n```sh\n# comentario\nnpm i\n```\nFin.",
    );
    expect(result.sections).toEqual([]);
    expect(result.intro?.body).toContain("# comentario");
  });

  it("no corta en encabezados de nivel 3 o más", () => {
    const result = splitNotesSections("# A\n### Sub\ntexto");
    expect(result.intro).toEqual({ heading: "A", body: "### Sub\ntexto" });
  });

  it("devuelve vacío con una descripción vacía", () => {
    expect(splitNotesSections("  ")).toEqual({ intro: null, sections: [] });
  });
});
