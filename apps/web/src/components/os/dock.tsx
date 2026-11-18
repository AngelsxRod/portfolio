"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { trayWindows } from "@/lib/os/desktop";
import { activeRoute, osRoutes } from "@/lib/os/routes";
import { DockIcon } from "@/components/os/dock-icon";
import { useDesktop } from "@/components/os/desktop-provider";

const DOCK_ID = "os-dock";

/**
 * Menú lateral del escritorio: arranca oculto fuera del borde izquierdo y se
 * desliza con la pestaña anclada a su borde derecho. Flota encima del
 * escritorio sin desplazarlo. En el teléfono lo sustituye el menú de la barra
 * superior.
 */
export function Dock({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const active = activeRoute(pathname);
  const { state } = useDesktop();
  const hidden = trayWindows(state).filter((window) => window.hidden).length;
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const tab = useRef<HTMLButtonElement>(null);

  // Al navegar, el menú vuelve a ocultarse.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const panel = document.getElementById(DOCK_ID);
    const target =
      panel?.querySelector<HTMLElement>('a[aria-current="page"]') ??
      panel?.querySelector<HTMLElement>("a");
    target?.focus({ preventScroll: true });
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      requestAnimationFrame(() => tab.current?.focus());
    }
    function onPointer(event: PointerEvent) {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div
      ref={wrap}
      className={`os-dockwrap${open ? " is-open" : ""}`}
      data-open={open}
    >
      <div id={DOCK_ID} className="os-dockpanel" inert={!open}>
        <nav className="os-dock" aria-label="Navegación principal">
          {osRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              aria-current={route === active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <DockIcon icon={route.icon} />
              {route.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
      <Button
        ref={tab}
        variant="ghost"
        className="os-dock-tab"
        aria-expanded={open}
        aria-controls={DOCK_ID}
        aria-label={`${open ? "Cerrar" : "Abrir"} menú${
          hidden > 0
            ? ` (${hidden} ${hidden === 1 ? "ventana oculta" : "ventanas ocultas"})`
            : ""
        }`}
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Flecha hacia donde se moverá el menú: › abre, ‹ cierra. */}
          <path d={open ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
        </svg>
        <span className="os-dock-tab-label" aria-hidden="true">
          Menú
        </span>
        {hidden > 0 && (
          <span className="os-dock-tab-badge" aria-hidden="true">
            {hidden}
          </span>
        )}
      </Button>
    </div>
  );
}
