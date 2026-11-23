"use client";

import { useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { Button } from "@repo/ui/components/button";
import { trayWindows } from "@/lib/os/desktop";
import { activeRoute, osRoutes } from "@/lib/os/routes";
import { DockIcon } from "@/components/os/dock-icon";
import { useDesktop } from "@/components/os/desktop-provider";

const DOCK_ID = "os-dock";

/**
 * Menú lateral del escritorio: un popover nativo que se desliza desde el borde
 * izquierdo, con la pestaña pegada a su borde derecho. El navegador se encarga
 * de cerrarlo con Escape o al hacer clic fuera, de devolver el foco a la
 * pestaña y de anunciar si está abierto. En el teléfono lo sustituye el menú
 * de la barra superior.
 */
export function Dock({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const active = activeRoute(pathname);
  const { state } = useDesktop();
  const hidden = trayWindows(state).filter((window) => window.hidden).length;
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  function onToggle(event: SyntheticEvent<HTMLDivElement>) {
    const isOpen = (event.nativeEvent as ToggleEvent).newState === "open";
    setOpen(isOpen);
    if (!isOpen) return;
    const element = event.currentTarget;
    // La pestaña se desplaza exactamente el ancho del panel.
    wrap.current?.style.setProperty(
      "--os-dock-width",
      `${element.offsetWidth}px`,
    );
    const target =
      element.querySelector<HTMLElement>('a[aria-current="page"]') ??
      element.querySelector<HTMLElement>("a");
    target?.focus({ preventScroll: true });
  }

  return (
    <div ref={wrap} className="os-dockwrap">
      <div
        ref={panel}
        id={DOCK_ID}
        popover="auto"
        className="os-dockpanel"
        onToggle={onToggle}
      >
        <nav className="os-dock" aria-label="Navegación principal">
          {osRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              aria-current={route === active ? "page" : undefined}
              // Al navegar, el menú vuelve a ocultarse.
              onClick={() => panel.current?.hidePopover()}
            >
              <DockIcon icon={route.icon} />
              {route.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
      <Button
        variant="ghost"
        className="os-dock-tab"
        popoverTarget={DOCK_ID}
        aria-label={`${open ? "Cerrar" : "Abrir"} menú${
          hidden > 0
            ? ` (${hidden} ${hidden === 1 ? "ventana oculta" : "ventanas ocultas"})`
            : ""
        }`}
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
