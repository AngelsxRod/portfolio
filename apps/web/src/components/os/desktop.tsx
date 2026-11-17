"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { desktopHeight } from "@/lib/os/desktop";
import { useDesktop } from "@/components/os/desktop-provider";

/** Región principal de cada página: el escritorio donde viven sus ventanas. */
export function Desktop({
  children,
  label,
  className,
}: {
  children: ReactNode;
  className?: string;
  /** Nombre accesible del escritorio, p. ej. «Escritorio de proyectos». */
  label?: string;
}) {
  const { state, dispatch } = useDesktop();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry)
        dispatch({ type: "fit", width: Math.round(entry.contentRect.width) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [dispatch]);
  return (
    <main
      ref={ref}
      id="contenido"
      tabIndex={-1}
      aria-label={label}
      className={`os-desk${className ? ` ${className}` : ""}`}
      style={{ minHeight: desktopHeight(state) }}
    >
      {children}
    </main>
  );
}
