import { describe, expect, it } from "vitest";
import {
  desktopHeight,
  desktopReducer,
  FOOTER_STACK,
  initialDesktop,
  STACK_GAP,
  trayWindows,
  type DesktopAction,
  type DesktopState,
} from "./desktop";

const hola = {
  type: "register",
  id: "hola",
  title: "hola.txt",
  defaultPosition: { x: 64, y: 48 },
  width: 660,
} as const;
const notas = {
  type: "register",
  id: "notas",
  title: "notas.md",
  defaultPosition: { x: 800, y: 40 },
  width: 420,
} as const;

function run(...actions: DesktopAction[]): DesktopState {
  return actions.reduce(desktopReducer, initialDesktop);
}

describe("desktopReducer", () => {
  it("registra ventanas en su posición por defecto y en orden", () => {
    const state = run(hola, notas);
    expect(state.windows.map((w) => w.id)).toEqual(["hola", "notas"]);
    expect(state.windows[0]).toMatchObject({
      position: { x: 64, y: 48 },
      hidden: null,
    });
  });

  it("ignora un registro repetido sin perder el estado", () => {
    const state = run(
      hola,
      { type: "move", id: "hola", position: { x: 100, y: 120 } },
      hola,
    );
    expect(state.windows).toHaveLength(1);
    expect(state.windows[0]!.position).toEqual({ x: 100, y: 120 });
  });

  it("trae al frente la ventana enfocada", () => {
    const state = run(hola, notas, { type: "focus", id: "hola" });
    const [first, second] = state.windows;
    expect(first!.z).toBeGreaterThan(second!.z);
    const again = desktopReducer(state, { type: "focus", id: "notas" });
    expect(again.windows[1]!.z).toBeGreaterThan(again.windows[0]!.z);
  });

  it("no deja mover una ventana a coordenadas negativas", () => {
    const state = run(hola, {
      type: "move",
      id: "hola",
      position: { x: -40, y: -10 },
    });
    expect(state.windows[0]!.position).toEqual({ x: 0, y: 0 });
  });

  it("mantiene la barra alcanzable dentro del ancho del escritorio", () => {
    const state = run(
      hola,
      { type: "fit", width: 1000 },
      {
        type: "move",
        id: "hola",
        position: { x: 5000, y: 10 },
      },
    );
    expect(state.windows[0]!.position.x).toBe(1000 - 80);
  });

  it("ajusta las posiciones por defecto a un escritorio estrecho", () => {
    const state = run(notas, { type: "fit", width: 1024 });
    expect(state.windows[0]!.position.x).toBe(1024 - 420 - 16);
  });

  it("vuelve a la posición por defecto si el escritorio crece", () => {
    const state = run(
      notas,
      { type: "fit", width: 1024 },
      { type: "fit", width: 1440 },
    );
    expect(state.windows[0]!.position.x).toBe(800);
  });

  it("conserva la posición arrastrada al cambiar el ancho", () => {
    const state = run(
      notas,
      { type: "move", id: "notas", position: { x: 300, y: 20 } },
      { type: "fit", width: 1440 },
    );
    expect(state.windows[0]!.position).toEqual({ x: 300, y: 20 });
  });

  it("minimiza, cierra y restaura trayendo al frente", () => {
    let state = run(hola, notas, { type: "minimize", id: "hola" });
    expect(state.windows[0]!.hidden).toBe("minimized");
    state = desktopReducer(state, { type: "close", id: "notas" });
    expect(state.windows[1]!.hidden).toBe("closed");
    state = desktopReducer(state, { type: "restore", id: "hola" });
    expect(state.windows[0]!.hidden).toBeNull();
    expect(state.windows[0]!.z).toBe(state.top);
  });

  it("alterna la visibilidad desde la bandeja", () => {
    let state = run(hola, { type: "toggle", id: "hola" });
    expect(state.windows[0]!.hidden).toBe("minimized");
    state = desktopReducer(state, { type: "toggle", id: "hola" });
    expect(state.windows[0]!.hidden).toBeNull();
  });

  it("restablece la posición por defecto", () => {
    const state = run(
      hola,
      { type: "move", id: "hola", position: { x: 400, y: 300 } },
      { type: "reset", id: "hola" },
    );
    expect(state.windows[0]!.position).toEqual({ x: 64, y: 48 });
  });

  it("renombra una ventana sin moverla", () => {
    const state = run(
      hola,
      { type: "move", id: "hola", position: { x: 300, y: 200 } },
      { type: "rename", id: "hola", title: "adios.txt" },
    );
    expect(state.windows[0]).toMatchObject({
      title: "adios.txt",
      position: { x: 300, y: 200 },
    });
  });

  it("desregistra la ventana al desmontarla", () => {
    const state = run(hola, notas, { type: "unregister", id: "hola" });
    expect(state.windows.map((w) => w.id)).toEqual(["notas"]);
  });

  it("ignora acciones sobre ventanas desconocidas", () => {
    const state = run(hola);
    expect(desktopReducer(state, { type: "focus", id: "nada" })).toBe(state);
  });
});

describe("desktopHeight", () => {
  it("cubre la ventana visible más baja con margen", () => {
    const state = run(
      hola,
      notas,
      { type: "resize", id: "hola", height: 900 },
      { type: "resize", id: "notas", height: 2000 },
      { type: "close", id: "notas" },
    );
    expect(desktopHeight(state)).toBe(48 + 900 + 48);
  });

  it("no baja del mínimo", () => {
    expect(desktopHeight(run(hola))).toBe(640);
  });
});

describe("columnas", () => {
  const col = (id: string, y: number) =>
    ({
      type: "register",
      id,
      title: id,
      defaultPosition: { x: 900, y },
      width: 420,
      stack: "derecha",
    }) as const;

  it("apila las ventanas de una columna según su alto real", () => {
    const state = run(col("a", 36), col("b", 500), {
      type: "resize",
      id: "a",
      height: 700,
    });
    expect(state.windows[1]!.position).toEqual({
      x: 900,
      y: 36 + 700 + STACK_GAP,
    });
  });

  it("sube la siguiente cuando se oculta la de arriba y la baja al restaurarla", () => {
    let state = run(
      col("a", 36),
      col("b", 500),
      { type: "resize", id: "a", height: 300 },
      { type: "minimize", id: "a" },
    );
    expect(state.windows[1]!.position.y).toBe(36);
    state = desktopReducer(state, { type: "restoreAll" });
    expect(state.windows[1]!.position.y).toBe(36 + 300 + STACK_GAP);
  });

  it("deja fuera de la columna a la que se arrastró", () => {
    const state = run(
      col("a", 36),
      col("b", 500),
      { type: "resize", id: "a", height: 300 },
      { type: "move", id: "a", position: { x: 10, y: 10 } },
      { type: "resize", id: "b", height: 100 },
    );
    expect(state.windows[0]!.position).toEqual({ x: 10, y: 10 });
    expect(state.windows[1]!.position.y).toBe(36);
  });

  it("restablecer devuelve la ventana a su lugar en la columna", () => {
    const state = run(
      col("a", 36),
      col("b", 500),
      { type: "resize", id: "a", height: 300 },
      { type: "move", id: "b", position: { x: 10, y: 10 } },
      { type: "reset", id: "b" },
    );
    expect(state.windows[1]!.position).toEqual({
      x: 900,
      y: 36 + 300 + STACK_GAP,
    });
  });
});

describe("escritorio estrecho", () => {
  const left = {
    type: "register",
    id: "izq",
    title: "izq",
    defaultPosition: { x: 64, y: 48 },
    width: 660,
    stack: "izquierda",
  } as const;
  const right = {
    type: "register",
    id: "der",
    title: "der",
    defaultPosition: { x: 790, y: 36 },
    width: 560,
    stack: "derecha",
  } as const;

  it("mantiene dos columnas cuando caben lado a lado", () => {
    const state = run(left, right, { type: "fit", width: 1400 });
    expect(state.windows.map((w) => w.position)).toEqual([
      { x: 64, y: 48 },
      { x: 790, y: 36 },
    ]);
  });

  it("apila todo en una columna cuando las columnas se pisarían", () => {
    const state = run(
      left,
      right,
      { type: "fit", width: 924 },
      { type: "resize", id: "izq", height: 400 },
    );
    expect(state.windows.map((w) => w.position)).toEqual([
      { x: 24, y: 48 },
      { x: 24, y: 48 + 400 + STACK_GAP },
    ]);
  });
});

describe("elementos que no son ventanas", () => {
  const note = {
    type: "register",
    id: "nota",
    title: "Nota",
    defaultPosition: { x: 64, y: 600 },
    width: 250,
    tray: false,
  } as const;

  it("no aparecen en la bandeja ni se pueden ocultar", () => {
    const state = run(hola, note, { type: "close", id: "nota" });
    expect(trayWindows(state).map((w) => w.id)).toEqual(["hola"]);
    expect(state.windows[1]!.hidden).toBeNull();
  });
});

describe("columna al pie", () => {
  const register = (
    id: string,
    x: number,
    width: number,
    stack: string,
    y = 36,
  ) =>
    ({
      type: "register",
      id,
      title: id,
      defaultPosition: { x, y },
      width,
      stack,
    }) as const;
  const browser = register("navegador", 40, 900, "izquierda");
  const info = register("ficha", 980, 420, "derecha");
  const notes = register("notas", 40, 1360, FOOTER_STACK, 500);
  const related = register("otros", 40, 1360, FOOTER_STACK, 900);

  it("empieza debajo de la columna más baja", () => {
    const state = run(
      browser,
      info,
      notes,
      { type: "fit", width: 1440 },
      { type: "resize", id: "navegador", height: 700 },
      { type: "resize", id: "ficha", height: 760 },
    );
    expect(state.windows[0]!.position).toEqual({ x: 40, y: 36 });
    expect(state.windows[1]!.position).toEqual({ x: 980, y: 36 });
    expect(state.windows[2]!.position).toEqual({
      x: 40,
      y: 36 + 760 + STACK_GAP,
    });
  });

  it("apila sus ventanas por su alto real", () => {
    const state = run(
      browser,
      info,
      notes,
      related,
      { type: "fit", width: 1440 },
      { type: "resize", id: "navegador", height: 700 },
      { type: "resize", id: "ficha", height: 400 },
      { type: "resize", id: "notas", height: 300 },
    );
    const top = 36 + 700 + STACK_GAP;
    expect(state.windows[2]!.position.y).toBe(top);
    expect(state.windows[3]!.position.y).toBe(top + 300 + STACK_GAP);
  });

  it("sube cuando se oculta la columna más alta", () => {
    const state = run(
      browser,
      info,
      notes,
      { type: "fit", width: 1440 },
      { type: "resize", id: "navegador", height: 700 },
      { type: "resize", id: "ficha", height: 400 },
      { type: "minimize", id: "navegador" },
    );
    expect(state.windows[2]!.position.y).toBe(36 + 400 + STACK_GAP);
  });

  it("no fuerza la columna única por ser más ancha que las demás", () => {
    const state = run(browser, info, notes, { type: "fit", width: 1440 });
    expect(state.windows[1]!.position.x).toBe(980);
  });

  it("en columna única sigue el orden de registro", () => {
    const state = run(
      browser,
      info,
      notes,
      { type: "fit", width: 1000 },
      { type: "resize", id: "navegador", height: 500 },
      { type: "resize", id: "ficha", height: 600 },
    );
    expect(state.windows.map((w) => w.position.y)).toEqual([
      36,
      36 + 500 + STACK_GAP,
      36 + 500 + STACK_GAP + 600 + STACK_GAP,
    ]);
  });
});
