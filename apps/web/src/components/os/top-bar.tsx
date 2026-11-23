"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { activeRoute } from "@/lib/os/routes";
import { BrandMark } from "@/components/os/brand-mark";
import { Clock } from "@/components/os/clock";
import { MobileMenu } from "@/components/os/mobile-menu";
import { useMascot } from "@/components/os/mascot-provider";

export function TopBar() {
  const t = useTranslations("topBar");
  const nav = useTranslations("nav");
  const route = activeRoute(usePathname());
  const { enabled, toggle } = useMascot();
  return (
    <header className="os-topbar">
      <div className="os-topbar-group">
        <Link className="os-logo" href="/" aria-label={t("home")}>
          <BrandMark size={22} />
          angel.os
        </Link>
        {route && <span className="os-topbar-page">{nav(route.labelKey)}</span>}
      </div>
      <div className="os-topbar-group">
        <button
          type="button"
          className="os-me"
          aria-pressed={enabled}
          aria-label={t("mascot")}
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
            kaled · {enabled ? t("online") : t("away")}
          </span>
          <span className="os-me-dot" aria-hidden="true" />
        </button>
        <span className="os-topbar-place">{t("place")}</span>
        <Clock className="os-topbar-clock" />
        <MobileMenu />
      </div>
    </header>
  );
}
