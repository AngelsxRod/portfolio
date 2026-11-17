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
  /** La persona la arrastró; deja de seguir su posición por defecto. */
  moved: boolean;
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
    }
  | { type: "unregister"; id: string }
  | { type: "rename"; id: string; title: string }
  | { type: "focus"; id: string }
  | { type: "move"; id: string; position: Point }
  | { type: "minimize"; id: string }
  | { type: "close"; id: string }
  | { type: "restore"; id: string }
  | { type: "toggle"; id: string }
  | { type: "reset"; id: string }
  | { type: "resize"; id: string; height: number }
  | { type: "fit"; width: number };

export const initialDesktop: DesktopState = { top: 10, width: 0, windows: [] };

/** Parte de la barra que siempre queda dentro del escritorio para poder arrastrarla. */
const GRAB_MARGIN = 80;
/** Separación con el borde derecho al ajustar una posición por defecto. */
const EDGE_GAP = 16;
export const MIN_DESKTOP_HEIGHT = 860;
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

export function desktopReducer(
  state: DesktopState,
  action: DesktopAction,
): DesktopState {
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
      };
      window.position = fitted(window, state.width);
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
      return update(state, action.id, () => ({ hidden: "minimized" }));
    case "close":
      return update(state, action.id, () => ({ hidden: "closed" }));
    case "restore":
      return update(state, action.id, () => ({ hidden: null }), true);
    case "toggle": {
      const window = state.windows.find((item) => item.id === action.id);
      if (!window) return state;
      return desktopReducer(state, {
        type: window.hidden ? "restore" : "minimize",
        id: action.id,
      });
    }
    case "reset":
      return update(
        state,
        action.id,
        (window) => ({ position: fitted(window, state.width), moved: false }),
        true,
      );
    case "resize":
      return update(state, action.id, () => ({ height: action.height }));
    case "fit": {
      if (action.width === state.width) return state;
      return {
        ...state,
        width: action.width,
        windows: state.windows.map((window) => ({
          ...window,
          // Sin arrastrar, sigue su posición por defecto ajustada al nuevo ancho.
          position: window.moved
            ? clamp(window.position, action.width)
            : fitted(window, action.width),
        })),
      };
    }
  }
}

/** Alto del escritorio para que ninguna ventana visible quede cortada. */
export function desktopHeight(state: DesktopState) {
  return state.windows.reduce(
    (height, window) =>
      window.hidden
        ? height
        : Math.max(height, window.position.y + window.height + BOTTOM_GAP),
    MIN_DESKTOP_HEIGHT,
  );
}
