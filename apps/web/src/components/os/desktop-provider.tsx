"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  desktopReducer,
  initialDesktop,
  type DesktopAction,
  type DesktopState,
  type DesktopWindow,
  type Point,
} from "@/lib/os/desktop";

type DesktopContextValue = {
  state: DesktopState;
  dispatch: Dispatch<DesktopAction>;
};

const DesktopContext = createContext<DesktopContextValue | null>(null);

/** Estado compartido entre las ventanas de la página y la bandeja del dock. */
export function DesktopProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(desktopReducer, initialDesktop);
  return (
    <DesktopContext.Provider value={{ state, dispatch }}>
      {children}
    </DesktopContext.Provider>
  );
}

export function useDesktop() {
  const context = useContext(DesktopContext);
  if (!context) throw new Error("Falta DesktopProvider.");
  return context;
}

export const trayButtonId = (id: string) => `os-tray-${id}`;
export const windowElementId = (id: string) => `os-win-${id}`;

/** Lleva el foco a un elemento cuando React ya aplicó el cambio en el DOM. */
export function focusLater(elementId: string) {
  requestAnimationFrame(() => document.getElementById(elementId)?.focus());
}

/**
 * Registra una ventana mientras está montada. Antes del registro (render del
 * servidor y primera hidratación) devuelve su estado por defecto.
 */
export function useDesktopWindow({
  id,
  title,
  defaultPosition,
  width,
}: {
  id: string;
  title: string;
  defaultPosition: Point;
  width: number;
}): { window: DesktopWindow; dispatch: Dispatch<DesktopAction> } {
  const { state, dispatch } = useDesktop();
  const { x, y } = defaultPosition;
  const initialTitle = useRef(title);
  useEffect(() => {
    dispatch({
      type: "register",
      id,
      title: initialTitle.current,
      defaultPosition: { x, y },
      width,
    });
    return () => dispatch({ type: "unregister", id });
  }, [dispatch, id, x, y, width]);
  // Cambiar el título (p. ej. «vista — archivo») no reinicia la ventana.
  useEffect(() => {
    dispatch({ type: "rename", id, title });
  }, [dispatch, id, title]);
  const window = state.windows.find((item) => item.id === id) ?? {
    id,
    title,
    defaultPosition,
    position: defaultPosition,
    width,
    height: 0,
    z: 1,
    hidden: null,
    moved: false,
  };
  return { window, dispatch };
}
