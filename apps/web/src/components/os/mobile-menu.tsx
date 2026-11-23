"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { Button } from "@repo/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet";
import { osFontClasses } from "@/lib/os/fonts";
import { trayWindows } from "@/lib/os/desktop";
import { activeRoute, osRoutes } from "@/lib/os/routes";
import { BrandMark } from "@/components/os/brand-mark";
import { DockIcon } from "@/components/os/dock-icon";
import { useDesktop } from "@/components/os/desktop-provider";

/** Menú lateral del teléfono: navegación principal y ventanas ocultas. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const active = activeRoute(usePathname());
  const { state, dispatch } = useDesktop();
  const hidden = trayWindows(state).filter((window) => window.hidden).length;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="outline" className="os-menu-button" />}
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
        Menú
      </SheetTrigger>
      <SheetContent
        side="left"
        className={`os-theme dark os-sheet ${osFontClasses}`}
      >
        <SheetTitle className="os-sheet-title">
          <BrandMark size={22} />
          angel.os
        </SheetTitle>
        <SheetDescription className="sr-only">
          Secciones del sitio
        </SheetDescription>
        <nav aria-label="Navegación principal" className="os-sheet-nav">
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
        {hidden > 0 && (
          <Button
            className="os-btn os-btn-primary os-sheet-restore"
            onClick={() => {
              dispatch({ type: "restoreAll" });
              setOpen(false);
            }}
          >
            Mostrar {hidden}{" "}
            {hidden === 1 ? "ventana oculta" : "ventanas ocultas"}
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
