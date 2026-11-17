/** Estado de las ventanas de una página del escritorio angel.os. */

export type Point = { x: number; y: number };

export type WindowHidden = null | "minimized" | "closed";

export type DesktopWindow = {
  id: string;
  title: string;
  defaultPosition: Point;
  position: Point;
  width: number;
  /** Alto medido en el navegador; 0 hasta conocerlo. */
  height: number;
  z: number;
  hidden: WindowHidden;
  /** La persona la arrastró; deja de seguir la disposición automática. */
  moved: boolean;
  /**
   * Columna en la que se apila. Las ventanas de una misma columna se colocan
   * una debajo de otra según su alto real, empezando en el `y` por defecto de
   * la primera, así un texto largo nunca tapa a la siguiente.
   */
  stack: string | null;
  /** `false` para elementos del escritorio que no son ventanas (notas, accesos). */
  tray: boolean;
};

export type DesktopState = {
  /** Mayor z-index asignado. */
  top: number;
  /** Ancho disponible del escritorio; 0 mientras no se mide. */
  width: number;
  windows: DesktopWindow[];
};

export type DesktopAction =
  | {
      type: "register";
      id: string;
      title: string;
      defaultPosition: Point;
      width: number;
      stack?: string;
      tray?: boolean;
    }
  | { type: "unregister"; id: string }
  | { type: "rename"; id: string; title: string }
  | { type: "focus"; id: string }
  | { type: "move"; id: string; position: Point }
  | { type: "minimize"; id: string }
  | { type: "close"; id: string }
  | { type: "restore"; id: string }
  | { type: "restoreAll" }
  | { type: "toggle"; id: string }
  | { type: "reset"; id: string }
  | { type: "resize"; id: string; height: number }
  | { type: "fit"; width: number };

export const initialDesktop: DesktopState = { top: 10, width: 0, windows: [] };

/** Parte de la barra que siempre queda dentro del escritorio para poder arrastrarla. */
const GRAB_MARGIN = 80;
/** Separación con el borde derecho al ajustar una posición por defecto. */
const EDGE_GAP = 16;
/** Separación vertical entre elementos apilados en una columna. */
export const STACK_GAP = 36;
export const MIN_DESKTOP_HEIGHT = 640;
const BOTTOM_GAP = 48;

function clamp(position: Point, deskWidth: number): Point {
  const maxX = deskWidth > 0 ? deskWidth - GRAB_MARGIN : Infinity;
  return {
    x: Math.round(Math.max(0, Math.min(position.x, maxX))),
    y: Math.round(Math.max(0, position.y)),
  };
}

/** Posición por defecto ajustada para que la ventana quepa en el escritorio. */
function fitted(window: DesktopWindow, deskWidth: number): Point {
  if (deskWidth <= 0) return window.defaultPosition;
  const maxX = Math.max(0, deskWidth - window.width - EDGE_GAP);
  return {
    x: Math.min(window.defaultPosition.x, maxX),
    y: window.defaultPosition.y,
  };
}

/**
 * Coloca las ventanas que no se arrastraron: las de una columna se apilan por
 * su alto real; las sueltas vuelven a su posición por defecto ajustada.
 */
function layout(state: DesktopState): DesktopState {
  // Cada columna empieza en el `y` por defecto de su primer elemento, aunque
  // ese elemento esté oculto o se haya arrastrado.
  const next = new Map<string, number>();
  for (const window of state.windows)
    if (window.stack && !next.has(window.stack))
      next.set(window.stack, window.defaultPosition.y);
  const windows = state.windows.map((window) => {
    if (window.moved) return window;
    const base = fitted(window, state.width);
    if (!window.stack) return { ...window, position: base };
    const visible = !window.hidden;
    const y = next.get(window.stack)!;
    if (visible) next.set(window.stack, y + window.height + STACK_GAP);
    return { ...window, position: { x: base.x, y } };
  });
  return { ...state, windows };
}

function update(
  state: DesktopState,
  id: string,
  change: (window: DesktopWindow, top: number) => Partial<DesktopWindow>,
  raise = false,
): DesktopState {
  const index = state.windows.findIndex((window) => window.id === id);
  if (index === -1) return state;
  const top = raise ? state.top + 1 : state.top;
  const windows = state.windows.slice();
  windows[index] = { ...windows[index]!, ...change(windows[index]!, top) };
  if (raise) windows[index]!.z = top;
  return { ...state, top, windows };
}

function reduce(state: DesktopState, action: DesktopAction): DesktopState {
  switch (action.type) {
    case "register": {
      if (state.windows.some((window) => window.id === action.id)) return state;
      const window: DesktopWindow = {
        id: action.id,
        title: action.title,
        defaultPosition: action.defaultPosition,
        position: action.defaultPosition,
        width: action.width,
        height: 0,
        z: 1,
        hidden: null,
        moved: false,
        stack: action.stack ?? null,
        tray: action.tray ?? true,
      };
      return { ...state, windows: [...state.windows, window] };
    }
    case "unregister":
      return {
        ...state,
        windows: state.windows.filter((window) => window.id !== action.id),
      };
    case "rename":
      return update(state, action.id, () => ({ title: action.title }));
    case "focus":
      return update(state, action.id, () => ({}), true);
    case "move":
      return update(state, action.id, () => ({
        position: clamp(action.position, state.width),
        moved: true,
      }));
    case "minimize":
    case "close":
      return update(state, action.id, (window) =>
        window.tray
          ? { hidden: action.type === "close" ? "closed" : "minimized" }
          : {},
      );
    case "restore":
      return update(state, action.id, () => ({ hidden: null }), true);
    case "restoreAll":
      return {
        ...state,
        windows: state.windows.map((window) => ({ ...window, hidden: null })),
      };
    case "toggle": {
      const window = state.windows.find((item) => item.id === action.id);
      if (!window) return state;
      return reduce(state, {
        type: window.hidden ? "restore" : "minimize",
        id: action.id,
      });
    }
    case "reset":
      return update(state, action.id, () => ({ moved: false }), true);
    case "resize":
      return update(state, action.id, () => ({ height: action.height }));
    case "fit": {
      if (action.width === state.width) return state;
      return {
        ...state,
        width: action.width,
        windows: state.windows.map((window) =>
          window.moved
            ? { ...window, position: clamp(window.position, action.width) }
            : window,
        ),
      };
    }
  }
}

export function desktopReducer(
  state: DesktopState,
  action: DesktopAction,
): DesktopState {
  const next = reduce(state, action);
  if (next === state) return state;
  // Las acciones que solo cambian el título, el foco o una posición arrastrada
  // no alteran la disposición automática.
  return ["rename", "focus", "move"].includes(action.type)
    ? next
    : layout(next);
}

/** Ventanas que aparecen en la bandeja (excluye notas y accesos). */
export function trayWindows(state: DesktopState) {
  return state.windows.filter((window) => window.tray);
}

/** Alto del escritorio para que ningún elemento visible quede cortado. */
export function desktopHeight(state: DesktopState) {
  return state.windows.reduce(
    (height, window) =>
      window.hidden
        ? height
        : Math.max(height, window.position.y + window.height + BOTTOM_GAP),
    MIN_DESKTOP_HEIGHT,
  );
}
