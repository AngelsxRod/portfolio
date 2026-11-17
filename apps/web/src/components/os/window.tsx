"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Button } from "@repo/ui/components/button";
import type { Point } from "@/lib/os/desktop";
import {
  focusLater,
  trayButtonId,
  useDesktopWindow,
  windowElementId,
} from "@/components/os/desktop-provider";

/** Las ventanas solo se arrastran en el escritorio ancho; debajo se apilan. */
const DRAG_QUERY = "(min-width: 821px)";

export type WindowProps = {
  id: string;
  title: string;
  defaultPosition: Point;
  width: number;
  variant?: "lime" | "orange";
  /**
   * `id` del encabezado que nombra la ventana (p. ej. el `h1` de la página).
   * Sin él, el título de la barra es un `h2` y nombra la ventana.
   */
  labelledBy?: string;
  /** Retraso de la animación de aparición, en segundos. */
  delay?: number;
  /** `false` deja solo el botón de cerrar. */
  minimizable?: boolean;
  className?: string;
  children: ReactNode;
};

export function Window({
  id,
  title,
  defaultPosition,
  width,
  variant = "lime",
  labelledBy,
  delay = 0,
  minimizable = true,
  className,
  children,
}: WindowProps) {
  const { window, dispatch } = useDesktopWindow({
    id,
    title,
    defaultPosition,
    width,
  });
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ start: Point; origin: Point } | null>(null);
  const titleId = `${id}-titulo`;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      dispatch({ type: "resize", id, height: element.offsetHeight }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [dispatch, id, window.hidden]);

  if (window.hidden) return null;

  function hide(type: "minimize" | "close") {
    dispatch({ type, id });
    focusLater(trayButtonId(id));
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
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    dispatch({
      type: "move",
      id,
      position: {
        x: current.origin.x + event.clientX - current.start.x,
        y: current.origin.y + event.clientY - current.start.y,
      },
    });
  }

  function endDrag() {
    drag.current = null;
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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {labelledBy ? (
          <span className="os-bar-title">{title}</span>
        ) : (
          <h2 id={titleId} className="os-bar-title">
            {title}
          </h2>
        )}
        <span className="os-bar-controls">
          {minimizable && (
            <>
              <Button
                variant="ghost"
                className="os-wbtn"
                aria-label={`Minimizar ${title}`}
                onClick={() => hide("minimize")}
              >
                _
              </Button>
              <Button
                variant="ghost"
                className="os-wbtn"
                aria-label={`Restablecer la posición de ${title}`}
                onClick={() => dispatch({ type: "reset", id })}
              >
                □
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            className="os-wbtn"
            aria-label={`Cerrar ${title}`}
            onClick={() => hide("close")}
          >
            ×
          </Button>
        </span>
      </div>
      {children}
    </section>
  );
}
