"use client";

import {
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Button } from "@repo/ui/components/button";
import { clamp, type Point } from "@/lib/os/desktop";
import {
  focusLater,
  TRAY_TOGGLE_ID,
  useDesktop,
  useDesktopWindow,
  useMeasuredHeight,
  windowElementId,
} from "@/components/os/desktop-provider";

/** Las ventanas solo se arrastran en el escritorio ancho; debajo se apilan. */
const DRAG_QUERY = "(min-width: 821px)";

export type WindowProps = {
  id: string;
  /** Nombre claro de la ventana («Proyectos recientes»). */
  title: string;
  /** Guiño técnico que acompaña al título en gris («proyectos_recientes/»). */
  file?: string;
  defaultPosition: Point;
  width: number;
  /** Columna en la que se apila para no tapar a la siguiente. */
  stack?: string;
  variant?: "lime" | "orange";
  /**
   * `id` del encabezado que nombra la ventana (p. ej. el `h1` de la página).
   * Sin él, el título de la barra es un `h2` y nombra la ventana.
   */
  labelledBy?: string;
  /** Retraso de la animación de aparición, en segundos. */
  delay?: number;
  className?: string;
  children: ReactNode;
};

export function Window({
  id,
  title,
  file,
  defaultPosition,
  width,
  stack,
  variant = "lime",
  labelledBy,
  delay = 0,
  className,
  children,
}: WindowProps) {
  const { window, dispatch } = useDesktopWindow({
    id,
    title,
    defaultPosition,
    width,
    stack,
  });
  const { state } = useDesktop();
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ start: Point; origin: Point; last: Point } | null>(
    null,
  );
  const titleId = `${id}-titulo`;
  useMeasuredHeight(ref, id, dispatch, !window.hidden);

  if (window.hidden) return null;

  function hide() {
    dispatch({ type: "minimize", id });
    focusLater(TRAY_TOGGLE_ID);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if ((event.target as Element).closest("button,a,input,textarea")) return;
    if (!matchMedia(DRAG_QUERY).matches) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      start: { x: event.clientX, y: event.clientY },
      origin: window.position,
      last: window.position,
    };
  }

  // Mientras se arrastra, la posición se escribe directo en el nodo: así cada
  // movimiento del puntero no vuelve a renderizar el escritorio entero (mejor
  // INP). El estado se actualiza una sola vez, al soltar.
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    const node = ref.current;
    if (!current || !node) return;
    current.last = clamp(
      {
        x: current.origin.x + event.clientX - current.start.x,
        y: current.origin.y + event.clientY - current.start.y,
      },
      state.width,
    );
    node.style.left = `${current.last.x}px`;
    node.style.top = `${current.last.y}px`;
  }

  function endDrag() {
    const current = drag.current;
    drag.current = null;
    if (
      current &&
      (current.last.x !== current.origin.x ||
        current.last.y !== current.origin.y)
    )
      dispatch({ type: "move", id, position: current.last });
  }

  const style = {
    left: window.position.x,
    top: window.position.y,
    zIndex: window.z,
    width,
    "--os-delay": `${delay}s`,
  } as CSSProperties;

  return (
    <section
      ref={ref}
      id={windowElementId(id)}
      tabIndex={-1}
      aria-labelledby={labelledBy ?? titleId}
      className={`os-window${variant === "orange" ? " os-window-alt" : ""}${className ? ` ${className}` : ""}`}
      style={style}
      onPointerDown={() => dispatch({ type: "focus", id })}
    >
      <div
        className="os-bar"
        title="Arrastra desde aquí para mover la ventana"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="os-bar-heading">
          {labelledBy ? (
            <span className="os-bar-title">{title}</span>
          ) : (
            <h2 id={titleId} className="os-bar-title">
              {title}
            </h2>
          )}
          {file && (
            <span className="os-bar-file" aria-hidden="true">
              {file}
            </span>
          )}
        </span>
        <span className="os-bar-controls">
          <Button
            variant="ghost"
            className="os-wbtn"
            aria-label={`Minimizar ${title}`}
            title="Minimizar (recupérala en «Ventanas»)"
            onClick={hide}
          >
            _
          </Button>
          <Button
            variant="ghost"
            className="os-wbtn"
            aria-label={`Volver a colocar ${title} en su lugar`}
            title="Volver a su lugar"
            onClick={() => dispatch({ type: "reset", id })}
          >
            □
          </Button>
          <Button
            variant="ghost"
            className="os-wbtn"
            aria-label={`Cerrar ${title}`}
            title="Cerrar (recupérala en «Ventanas»)"
            onClick={hide}
          >
            ×
          </Button>
        </span>
      </div>
      {children}
    </section>
  );
}
