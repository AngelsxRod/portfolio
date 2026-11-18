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
 * Dock lateral. En pantallas anchas siempre está desplegado; entre 821 y
 * 1599 px (donde taparía las ventanas) se pliega en un riel con un botón que
 * lo abre encima del escritorio. El CSS decide cuándo aplica el pliegue.
 */
export function Dock({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const active = activeRoute(pathname);
  const { state } = useDesktop();
  const hidden = trayWindows(state).filter((window) => window.hidden).length;
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // Al navegar, el dock vuelve a plegarse.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    // El botón se oculta al desplegar: el foco pasa a la sección actual.
    const panel = document.getElementById(DOCK_ID);
    const target =
      panel?.querySelector<HTMLElement>('a[aria-current="page"]') ??
      panel?.querySelector<HTMLElement>("a");
    target?.focus({ preventScroll: true });
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      // El botón vuelve a mostrarse tras el render: enfocarlo entonces.
      requestAnimationFrame(() => toggle.current?.focus());
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
    <div ref={wrap} className="os-dockwrap" data-open={open}>
      <div className="os-rail">
        <Button
          ref={toggle}
          variant="ghost"
          className="os-rail-toggle"
          aria-expanded={open}
          aria-controls={DOCK_ID}
          aria-label="Abrir menú"
          onClick={() => setOpen((value) => !value)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          {hidden > 0 && (
            <span className="os-rail-badge" aria-hidden="true">
              {hidden}
            </span>
          )}
        </Button>
        {active && (
          <span className="os-rail-current" title={active.label}>
            <DockIcon icon={active.icon} />
            <span className="sr-only">Sección actual: {active.label}</span>
          </span>
        )}
      </div>
      <div id={DOCK_ID} className="os-dockpanel">
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
    </div>
  );
}
