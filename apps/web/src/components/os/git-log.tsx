"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Window } from "@/components/os/window";
import { focusLater } from "@/components/os/desktop-provider";
import type { TimelineBar } from "@/lib/os/timeline";

export type Commit = {
  id: string;
  hash: string;
  head: boolean;
  organization: string;
  title: string;
  period: string;
  description: string | null;
  achievements: string[];
  bar: TimelineBar;
};

export type StudyBar = { id: string; label: string; bar: TimelineBar };

const commitButtonId = (id: string) => `commit-${id}`;

/** `git log` de la trayectoria y la línea de tiempo que abre cada commit. */
export function GitLog({
  commits,
  studies,
  years,
}: {
  commits: Commit[];
  studies: StudyBar[];
  years: number[];
}) {
  const [open, setOpen] = useState<string | null>(commits[0]?.id ?? null);
  return (
    <>
      <Window
        id="git-log"
        title="git log — trayectoria"
        labelledBy="page-title"
        defaultPosition={{ x: 40, y: 36 }}
        width={800}
      >
        <div className="os-log">
          <h1 id="page-title" className="os-display">
            Trayectoria
          </h1>
          {commits.length > 0 ? (
            <>
              <p className="os-log-hint">
                Toca un commit para ver los cambios.
              </p>
              <ol className="os-commits">
                {commits.map((commit) => {
                  const expanded = open === commit.id;
                  return (
                    <li key={commit.id}>
                      <Button
                        variant="ghost"
                        id={commitButtonId(commit.id)}
                        className="os-commit"
                        aria-expanded={expanded}
                        aria-controls={`${commitButtonId(commit.id)}-cambios`}
                        onClick={() => setOpen(expanded ? null : commit.id)}
                      >
                        <span className="os-commit-dot" aria-hidden="true" />
                        <span className="os-commit-main">
                          <span className="os-commit-hash">
                            <span>{commit.hash}</span>
                            {commit.head && (
                              <span className="os-muted"> (HEAD → main)</span>
                            )}
                          </span>
                          <span className="os-display os-commit-org">
                            {commit.organization}
                          </span>
                          <span className="os-commit-title">
                            {commit.title}
                          </span>
                        </span>
                        <span className="os-commit-date">{commit.period}</span>
                      </Button>
                      <div
                        id={`${commitButtonId(commit.id)}-cambios`}
                        hidden={!expanded}
                        className="os-diff"
                      >
                        {commit.description && <p>{commit.description}</p>}
                        {commit.achievements.length > 0 && (
                          <ul>
                            {commit.achievements.map((achievement) => (
                              <li key={achievement}>+ {achievement}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </>
          ) : (
            <p className="os-empty">
              <strong>Aún no hay experiencia publicada.</strong>
              Aparecerá aquí cuando se publique desde el panel.
            </p>
          )}
        </div>
      </Window>

      {years.length > 0 && (
        <Window
          id="linea-de-tiempo"
          title={`linea_de_tiempo — ${years[0]} → hoy`}
          variant="orange"
          defaultPosition={{ x: 880, y: 36 }}
          width={520}
          delay={0.15}
        >
          <div className="os-timeline">
            <div
              className="os-years"
              style={{ gridTemplateColumns: `repeat(${years.length}, 1fr)` }}
              aria-hidden="true"
            >
              {years.map((year) => (
                <span key={year}>{year}</span>
              ))}
            </div>
            {commits.length > 0 && (
              <div className="os-track" role="group" aria-label="Trabajo">
                {commits.map((commit, index) => (
                  <Button
                    key={commit.id}
                    variant="ghost"
                    className="os-tbar os-tbar-work"
                    aria-label={`${commit.organization}, ${commit.period}`}
                    style={{
                      left: `${commit.bar.left}%`,
                      width: `${commit.bar.width}%`,
                      animationDelay: `${0.2 + index * 0.1}s`,
                    }}
                    onClick={() => {
                      setOpen(commit.id);
                      focusLater(commitButtonId(commit.id));
                    }}
                  />
                ))}
              </div>
            )}
            {studies.length > 0 && (
              <div className="os-track" role="group" aria-label="Estudios">
                {studies.map((study, index) => (
                  <Link
                    key={study.id}
                    href="/educacion"
                    className="os-tbar os-tbar-study"
                    aria-label={study.label}
                    style={{
                      left: `${study.bar.left}%`,
                      width: `${study.bar.width}%`,
                      animationDelay: `${0.5 + index * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <p className="os-timeline-note">
              Cada barra es un periodo real.{" "}
              {commits.length > 0 && "Las lima abren su commit. "}
              {studies.length > 0 && "Las naranjas llevan a Estudios."}
            </p>
          </div>
        </Window>
      )}
    </>
  );
}
