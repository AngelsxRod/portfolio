"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import {
  focusLater,
  useDesktop,
  windowElementId,
} from "@/components/os/desktop-provider";
import { Window } from "@/components/os/window";

export type StudyFile = {
  id: string;
  file: string;
  level: string;
  program: string;
  institution: string;
  period: string;
  description: string | null;
  current: boolean;
};

export type CertificateItem = {
  id: string;
  name: string;
  issuer: string;
  issued: string;
  verificationUrl: string | null;
};

const FOLDER = "certificados";
const VIEW_ID = "vista";

function FileIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" strokeWidth="2" aria-hidden="true">
      <path
        d="M14 6h26l12 12v40H14z"
        stroke="var(--os-bone)"
        fill="var(--os-surface-2)"
      />
      <path d="M40 6v12h12" stroke="var(--os-bone)" />
      <path d="M22 30h22M22 37h22M22 44h14" stroke="var(--os-lime)" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" strokeWidth="2" aria-hidden="true">
      <path
        d="M6 16h20l5 6h27v30H6z"
        stroke="var(--os-orange)"
        fill="#2a1a12"
      />
    </svg>
  );
}

/** Carpeta `~/estudios`: un archivo por estudio, `certificados/` y su vista. */
export function StudyFolder({
  studies,
  certificates,
}: {
  studies: StudyFile[];
  certificates: CertificateItem[];
}) {
  const { dispatch } = useDesktop();
  const [selected, setSelected] = useState(studies[0]?.id ?? FOLDER);
  const study = studies.find((item) => item.id === selected);
  const entries = [
    ...studies.map((item) => ({ id: item.id, file: item.file, folder: false })),
    { id: FOLDER, file: `${FOLDER}/`, folder: true },
  ];

  function open(id: string) {
    setSelected(id);
    dispatch({ type: "restore", id: VIEW_ID });
    focusLater(windowElementId(VIEW_ID));
  }

  return (
    <>
      <Window
        id="estudios"
        title="~/estudios"
        labelledBy="page-title"
        defaultPosition={{ x: 40, y: 36 }}
        width={720}
      >
        <div className="os-dir">
          <h1 id="page-title" className="os-display">
            Estudios
          </h1>
          <p className="os-dir-hint">
            Formación y certificados. Abre un archivo para verlo.
          </p>
          <ul className="os-files">
            {entries.map((entry, index) => (
              <li key={entry.id}>
                <Button
                  variant="ghost"
                  className="os-file"
                  aria-pressed={selected === entry.id}
                  onClick={() => open(entry.id)}
                  style={{ animationDelay: `${0.1 + index * 0.07}s` }}
                >
                  {entry.folder ? <FolderIcon /> : <FileIcon />}
                  <span className="os-fname">{entry.file}</span>
                </Button>
              </li>
            ))}
          </ul>
          <div className="os-dir-status">
            <span>
              {studies.length} {studies.length === 1 ? "estudio" : "estudios"}
            </span>
            <span>
              {certificates.length}{" "}
              {certificates.length === 1 ? "certificado" : "certificados"}
            </span>
          </div>
        </div>
      </Window>

      <Window
        id={VIEW_ID}
        title={`vista — ${entries.find((entry) => entry.id === selected)?.file ?? ""}`}
        variant="orange"
        defaultPosition={{ x: 820, y: 36 }}
        width={560}
        delay={0.15}
      >
        <div aria-live="polite">
          <div className="os-paper" key={selected}>
            {study ? (
              <>
                {study.current && (
                  <span className="os-stamp" aria-hidden="true">
                    EN
                    <br />
                    CURSO
                  </span>
                )}
                <p className="os-paper-kicker">
                  {study.level.toUpperCase()}
                  {study.current && <span className="sr-only">, en curso</span>}
                </p>
                <h3 className="os-display os-paper-title">{study.program}</h3>
                <p className="os-paper-org">{study.institution}</p>
                {study.description && (
                  <p className="os-paper-text">{study.description}</p>
                )}
                <dl className="os-paper-facts">
                  <dt>periodo</dt>
                  <dd>{study.period}</dd>
                </dl>
              </>
            ) : (
              <>
                <p className="os-paper-kicker">
                  {certificates.length > 0 ? "CARPETA" : "CARPETA VACÍA"}
                </p>
                <h3 className="os-display os-paper-title">Certificados</h3>
                {certificates.length > 0 ? (
                  <ul className="os-certs">
                    {certificates.map((certificate) => (
                      <li key={certificate.id}>
                        <strong>{certificate.name}</strong>
                        <span>
                          {certificate.issuer} · {certificate.issued}
                        </span>
                        {certificate.verificationUrl && (
                          <a
                            href={certificate.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Verificar ↗
                            <span className="sr-only">
                              {" "}
                              {certificate.name} (se abre en otra pestaña)
                            </span>
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="os-paper-text">
                    Aún no hay certificados publicados. Aparecerán aquí, con
                    emisor y fecha, cuando se publiquen desde el panel.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </Window>
    </>
  );
}
