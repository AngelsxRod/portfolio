"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeRoute } from "@/lib/os/routes";
import { Clock } from "@/components/os/clock";
import { MobileMenu } from "@/components/os/mobile-menu";

export function TopBar() {
  const route = activeRoute(usePathname());
  return (
    <header className="os-topbar">
      <div className="os-topbar-group">
        <Link className="os-logo" href="/" aria-label="angel.os, inicio">
          <i aria-hidden="true" />
          angel.os
        </Link>
        {route && <span className="os-topbar-page">{route.label}</span>}
      </div>
      <div className="os-topbar-group">
        <span className="os-topbar-place">Guatemala, GT</span>
        <Clock className="os-topbar-clock" />
        <MobileMenu />
      </div>
    </header>
  );
}
