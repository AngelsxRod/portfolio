"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ToggleGroup, ToggleGroupItem } from "@repo/ui/components/toggle-group";
import {
  ALL_FILTER,
  matchesFilter,
  type ProjectFilter,
} from "@/lib/os/projects";
import { OsLinkButton } from "@/components/os/os-button";
import { ProjectThumb, ProjectVisual } from "@/components/os/project-thumb";
import { Window } from "@/components/os/window";

export type ExplorerProject = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  projectType: string | null;
  number: string;
  host: string | null;
  demoUrl: string | null;
  preview: { id: string; altText: string } | null;
};

/** Explorador de `~/proyectos` con filtros y la ventana de vista previa. */
export function ProjectExplorer({
  projects,
  filters,
}: {
  projects: ExplorerProject[];
  filters: ProjectFilter[];
}) {
  const t = useTranslations("explorer");
  const nav = useTranslations("nav");
  const [filter, setFilter] = useState(ALL_FILTER);
  const [selectedId, setSelectedId] = useState(projects[0]?.id);
  const visible = projects.filter((project) => matchesFilter(project, filter));
  const selected =
    projects.find((project) => project.id === selectedId) ?? projects[0];

  return (
    <>
      <Window
        id="explorador"
        stack="izquierda"
        title={t("windowTitle")}
        file="~/proyectos"
        labelledBy="page-title"
        defaultPosition={{ x: 40, y: 36 }}
        width={900}
      >
        <div className="os-explorer">
          <div className="os-explorer-side">
            <h1 id="page-title" className="os-display">
              {nav("projects")}
            </h1>
            {filters.length > 1 && (
              <>
                <span className="os-explorer-label" id="filtros">
                  {t("filterLabel")}
                </span>
                <ToggleGroup
                  aria-labelledby="filtros"
                  orientation="vertical"
                  spacing={1}
                  value={[filter]}
                  onValueChange={(value) => setFilter(value[0] ?? ALL_FILTER)}
                  className="os-filters"
                >
                  {filters.map((item) => (
                    <ToggleGroupItem
                      key={item.value}
                      value={item.value}
                      className="os-filter"
                    >
                      <span>{item.label}</span>
                      <span>{item.count}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </>
            )}
            <p className="os-explorer-tip">{t("tip")}</p>
          </div>
          <div className="os-explorer-main">
            {visible.length > 0 ? (
              <ul className="os-cards">
                {visible.map((project, index) => (
                  <li key={project.id}>
                    <ProjectThumb
                      project={project}
                      // Primera tarjeta: es la imagen más grande al cargar en
                      // el teléfono, y comparte URL con la vista previa.
                      priority={index === 0}
                      onHighlight={() => setSelectedId(project.id)}
                      style={{ animationDelay: `${index * 0.06}s` }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="os-empty">
                <strong>{t("emptyTitle")}</strong>
                {t("emptyText")}
              </p>
            )}
            <div className="os-statusbar">
              <span>{t("count", { count: visible.length })}</span>
              {selected?.host && (
                <span>
                  {t("site")}{" "}
                  <span className="os-statusbar-strong">{selected.host}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Window>

      {selected && (
        <Window
          id="vista-previa"
          title={t("previewTitle")}
          file="vista_previa"
          stack="derecha"
          variant="orange"
          defaultPosition={{ x: 980, y: 56 }}
          width={420}
          delay={0.15}
        >
          <div aria-live="polite">
            <span className="os-preview-visual">
              <ProjectVisual
                project={selected}
                alt={selected.preview?.altText ?? ""}
                sizes="420px"
                priority
              />
            </span>
            <div className="os-preview-body">
              <span className="os-preview-kicker">
                {selected.number}
                {selected.projectType && ` — ${selected.projectType}`}
              </span>
              <p className="os-display os-preview-title">{selected.title}</p>
              <p className="os-preview-summary">{selected.summary}</p>
              <div className="os-actions">
                <OsLinkButton
                  href={`/projects/${selected.slug}`}
                  label={t("openPageLabel", { title: selected.title })}
                >
                  {t("openPage")}
                </OsLinkButton>
                {selected.demoUrl && (
                  <OsLinkButton
                    href={selected.demoUrl}
                    variant="outline"
                    external
                    label={t("visitLabel", { title: selected.title })}
                  >
                    {t("visit")}
                  </OsLinkButton>
                )}
              </div>
            </div>
          </div>
        </Window>
      )}
    </>
  );
}
