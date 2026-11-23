"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion";
import { Button } from "@repo/ui/components/button";
import { Window } from "@/components/os/window";
import { focusLater } from "@/components/os/desktop-provider";
import type { TimelineBar } from "@/lib/os/timeline";

export type Commit = {
  id: string;
  current: boolean;
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
  const t = useTranslations("gitLog");
  const nav = useTranslations("nav");
  const common = useTranslations("common");
  const [open, setOpen] = useState<string | null>(commits[0]?.id ?? null);
  return (
    <>
      <Window
        id="git-log"
        title={nav("experience")}
        file="git log"
        stack="izquierda"
        labelledBy="page-title"
        defaultPosition={{ x: 40, y: 36 }}
        width={800}
      >
        <div className="os-log">
          <h1 id="page-title" className="os-display">
            {nav("experience")}
          </h1>
          {commits.length > 0 ? (
            <>
              <p className="os-log-hint">{t("hint")}</p>
              <Accordion
                // Un solo trabajo abierto a la vez. Los detalles cerrados
                // usan hidden="until-found": la búsqueda del navegador
                // (Ctrl+F) los encuentra y los despliega.
                value={open ? [open] : []}
                onValueChange={(value) => setOpen(value[0] ?? null)}
                hiddenUntilFound
                className="os-commits"
                render={<ol />}
              >
                {commits.map((commit) => (
                  <AccordionItem
                    key={commit.id}
                    value={commit.id}
                    className="border-0"
                    render={<li />}
                  >
                    <AccordionTrigger
                      id={commitButtonId(commit.id)}
                      className="os-commit"
                    >
                      <span className="os-commit-dot" aria-hidden="true" />
                      <span className="os-commit-main">
                        {commit.current && (
                          <span className="os-commit-current">
                            {t("current")}
                          </span>
                        )}
                        <span className="os-display os-commit-org">
                          {commit.organization}
                        </span>
                        <span className="os-commit-title">{commit.title}</span>
                      </span>
                      <span className="os-commit-date">{commit.period}</span>
                    </AccordionTrigger>
                    <AccordionContent className="os-diff">
                      {commit.description && <p>{commit.description}</p>}
                      {!commit.description &&
                        commit.achievements.length === 0 && (
                          <p className="os-muted">{t("noDetails")}</p>
                        )}
                      {commit.achievements.length > 0 && (
                        <ul>
                          {commit.achievements.map((achievement) => (
                            <li key={achievement}>+ {achievement}</li>
                          ))}
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          ) : (
            <p className="os-empty">
              <strong>{t("emptyTitle")}</strong>
              {t("emptyText")}
            </p>
          )}
        </div>
      </Window>

      {years.length > 0 && (
        <Window
          id="linea-de-tiempo"
          title={t("timelineTitle")}
          file={`${years[0]} → ${common("present")}`}
          stack="derecha"
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
              <div
                className="os-track"
                role="group"
                aria-label={t("trackWork")}
              >
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
              <div
                className="os-track"
                role="group"
                aria-label={nav("education")}
              >
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
            <ul className="os-legend">
              {commits.length > 0 && (
                <li>
                  <span className="os-swatch os-tbar-work" aria-hidden="true" />
                  {t("legendWork")}
                </li>
              )}
              {studies.length > 0 && (
                <li>
                  <span
                    className="os-swatch os-tbar-study"
                    aria-hidden="true"
                  />
                  {t("legendStudies")}
                </li>
              )}
            </ul>
          </div>
        </Window>
      )}
    </>
  );
}
