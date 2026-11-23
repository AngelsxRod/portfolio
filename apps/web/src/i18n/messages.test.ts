import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import es from "../../messages/es.json";

type Tree = { [key: string]: string | Tree };

/** Aplana el árbol de mensajes a `ruta.clave → texto`. */
function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>(
    (result, [key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === "string"
        ? { ...result, [path]: value }
        : { ...result, ...flatten(value, path) };
    },
    {},
  );
}

/** Variables `{nombre}` de un mensaje, sin repetir ni importar el orden. */
function variables(message: string) {
  return [...new Set([...message.matchAll(/\{(\w+)[,}]/g)].map((m) => m[1]))]
    .sort()
    .join(",");
}

const spanish = flatten(es as Tree);
const english = flatten(en as Tree);

describe("mensajes", () => {
  it("ambos idiomas tienen exactamente las mismas claves", () => {
    expect(Object.keys(english).sort()).toEqual(Object.keys(spanish).sort());
  });

  it("no hay mensajes vacíos", () => {
    for (const [key, value] of [
      ...Object.entries(spanish),
      ...Object.entries(english),
    ])
      expect(value.trim(), key).not.toBe("");
  });

  it("cada mensaje usa las mismas variables en ambos idiomas", () => {
    for (const key of Object.keys(spanish))
      expect(variables(english[key] ?? ""), key).toBe(variables(spanish[key]!));
  });
});
