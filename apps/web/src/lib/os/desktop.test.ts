import { describe, expect, it } from "vitest";
import {
  desktopHeight,
  desktopReducer,
  initialDesktop,
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
    expect(desktopHeight(run(hola))).toBe(860);
  });
});
