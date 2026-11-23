"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { activeRoute } from "@/lib/os/routes";
import { BrandMark } from "@/components/os/brand-mark";
import { Clock } from "@/components/os/clock";
import { MobileMenu } from "@/components/os/mobile-menu";
import { useMascot } from "@/components/os/mascot-provider";

export function TopBar() {
  const route = activeRoute(usePathname());
  const { enabled, toggle } = useMascot();
  return (
    <header className="os-topbar">
      <div className="os-topbar-group">
        <Link className="os-logo" href="/" aria-label="angel.os, inicio">
          <BrandMark size={22} />
          angel.os
        </Link>
        {route && <span className="os-topbar-page">{route.label}</span>}
      </div>
      <div className="os-topbar-group">
        <button
          type="button"
          className="os-me"
          aria-pressed={enabled}
          aria-label="Mascota"
          onClick={toggle}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/avatar-kaled-base.svg"
            alt=""
            width={26}
            height={26}
          />
          <span className="os-me-text">
            kaled · {enabled ? "en línea" : "ausente"}
          </span>
          <span className="os-me-dot" aria-hidden="true" />
        </button>
        <span className="os-topbar-place">Guatemala, GT</span>
        <Clock className="os-topbar-clock" />
        <MobileMenu />
      </div>
    </header>
  );
}
