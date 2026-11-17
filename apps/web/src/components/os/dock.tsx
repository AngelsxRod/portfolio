"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeRoute, osRoutes } from "@/lib/os/routes";
import { DockIcon } from "@/components/os/dock-icon";

export function Dock({ children }: { children?: ReactNode }) {
  const active = activeRoute(usePathname());
  return (
    <div className="os-dockwrap">
      <nav className="os-dock" aria-label="Navegación principal">
        {osRoutes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            aria-current={route === active ? "page" : undefined}
          >
            <DockIcon icon={route.icon} />
            {route.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
