"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { markBootSeen } from "@/lib/os/boot";

/** Duración del arranque (debe coincidir con `os-bootout` en home.css). */
const BOOT_MS = 3200;

/**
 * Secuencia de arranque de la primera visita de la sesión. Es decorativa: el
 * contenido está debajo desde el principio y la animación solo es CSS.
 */
export function BootScreen({
  projectCount,
  name,
}: {
  projectCount: number;
  name: string;
}) {
  const t = useTranslations("boot");
  useEffect(() => {
    markBootSeen(() => window.sessionStorage);
    // Al volver al inicio sin recargar, el arranque no se repite.
    const timer = setTimeout(() => {
      document.documentElement.dataset.booted = "1";
    }, BOOT_MS);
    return () => clearTimeout(timer);
  }, []);
  const lines = [
    t("system"),
    <>
      <span className="os-boot-ok">[ ok ]</span> {t("loadingProjects")}{" "}
      {projectCount}
    </>,
    <>
      <span className="os-boot-ok">[ ok ]</span> {t("mounting")}
    </>,
    <>
      <span className="os-boot-ok">[ ok ]</span> {t("terminal")}
    </>,
    <>
      <span className="os-boot-ok">[ ok ]</span> {t("mail")}
    </>,
  ];
  return (
    <div className="os-boot" aria-hidden="true">
      <span className="os-display os-boot-title">angel.os</span>
      {lines.map((line, index) => (
        <span
          key={index}
          className="os-boot-line"
          style={{ animationDelay: `${0.2 + index * 0.4}s` }}
        >
          {line}
        </span>
      ))}
      <span
        className="os-boot-line os-boot-me"
        style={{ animationDelay: "2s" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/avatar-kaled-base.svg" alt="" width={44} height={44} />
        <span>
          {t("session")} <span className="os-boot-ok">{name}</span>
        </span>
      </span>
      <span className="os-boot-line" style={{ animationDelay: "2.4s" }}>
        &gt; {t("welcome")} <span className="os-caret" />
      </span>
    </div>
  );
}
