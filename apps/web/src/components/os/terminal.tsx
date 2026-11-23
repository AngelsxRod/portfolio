"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@repo/ui/components/button";
import { ProfileAvatar } from "@/components/os/avatar";

const prompt = "angel@os:~$ ";

function Command({ delay, children }: { delay: number; children: string }) {
  return (
    <div>
      <span className="os-prompt">{prompt}</span>
      <span className="os-type" style={{ animationDelay: `${delay}s` }}>
        {children}
      </span>
    </div>
  );
}

/**
 * Terminal de «Sobre mí». Todo el texto está en el DOM desde el inicio; la
 * escritura es solo una animación CSS, así que lectores de pantalla y
 * movimiento reducido lo ven completo.
 */
export function Terminal({
  name,
  subtitle,
  bio,
}: {
  name: string;
  subtitle: string | null;
  bio: string | null;
}) {
  const t = useTranslations("terminal");
  const nav = useTranslations("nav");
  const home = useTranslations("home");
  const [run, setRun] = useState(0);
  return (
    <div className="os-term" key={run}>
      <Command delay={0.3}>whoami</Command>
      <div className="os-out" style={{ animationDelay: "1s" }}>
        <div className="os-term-who">
          <ProfileAvatar
            interactive
            alt={home("avatarAlt", { name })}
            size={120}
            variant="orange"
            className="os-term-avatar"
          />
          <div>
            <h1 id="page-title" className="os-display">
              {name}
            </h1>
            {subtitle && <span className="os-muted">{subtitle}</span>}
          </div>
        </div>
      </div>
      <Command delay={1.5}>cat bio.txt</Command>
      <p className="os-out os-term-bio" style={{ animationDelay: "2.2s" }}>
        {bio ?? t("noBio")}
      </p>
      <Command delay={2.7}>{t("lsCommand")}</Command>
      <ul className="os-out os-term-ls" style={{ animationDelay: "3.4s" }}>
        <li>
          <Link className="os-link" href="/projects">
            {nav("projects")} →
          </Link>
        </li>
        <li>
          <Link className="os-link" href="/experiencia">
            {nav("experience")} →
          </Link>
        </li>
        <li>
          <Link className="os-link" href="/educacion">
            {nav("education")} →
          </Link>
        </li>
        <li>
          <Link className="os-link" href="/contacto">
            {nav("contact")} →
          </Link>
        </li>
      </ul>
      <div className="os-out" style={{ animationDelay: "3.8s" }}>
        <span className="os-prompt">{prompt}</span>
        <span className="os-caret" aria-hidden="true" />
      </div>
      <div className="os-out os-term-rerun" style={{ animationDelay: "3.8s" }}>
        <Button
          variant="outline"
          className="os-rerun"
          onClick={() => setRun((value) => value + 1)}
        >
          {t("rerun")}
        </Button>
      </div>
    </div>
  );
}
