"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";

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
  const [run, setRun] = useState(0);
  return (
    <div className="os-term" key={run}>
      <Command delay={0.3}>whoami</Command>
      <div className="os-out" style={{ animationDelay: "1s" }}>
        <h1 id="page-title" className="os-display">
          {name}
        </h1>
        {subtitle && <span className="os-muted">{subtitle}</span>}
      </div>
      <Command delay={1.5}>cat bio.txt</Command>
      <p className="os-out os-term-bio" style={{ animationDelay: "2.2s" }}>
        {bio ?? "bio.txt: el perfil aún no está publicado."}
      </p>
      <Command delay={2.7}>ls ~/trabajo</Command>
      <ul className="os-out os-term-ls" style={{ animationDelay: "3.4s" }}>
        <li>
          <Link className="os-link" href="/projects">
            proyectos/
          </Link>
        </li>
        <li>
          <Link className="os-link" href="/experiencia">
            trayectoria/
          </Link>
        </li>
        <li>
          <Link className="os-link" href="/educacion">
            estudios/
          </Link>
        </li>
        <li>
          <Link className="os-link" href="/contacto">
            contacto.eml
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
          ↻ volver a ejecutar
        </Button>
      </div>
    </div>
  );
}
