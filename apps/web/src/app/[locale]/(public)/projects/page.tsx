import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import "@/styles/os/projects.css";
import { getPublicProjects } from "@/lib/public-projects";
import { projectFilters, projectHost, projectPreview } from "@/lib/os/projects";
import { safeExternalUrl } from "@/lib/safe-url";
import { Blob, StickyNote } from "@/components/os/decor";
import { Desktop } from "@/components/os/desktop";
import {
  ProjectExplorer,
  type ExplorerProject,
} from "@/components/os/project-explorer";
import { Ticker } from "@/components/os/ticker";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "/projects", "projects");
}

export default async function ProjectsPage() {
  const [t, explorer] = await Promise.all([
    getTranslations("projects"),
    getTranslations("explorer"),
  ]);
  const projects = await getPublicProjects();
  const items: ExplorerProject[] = projects.map((project, index) => {
    const preview = projectPreview(project);
    return {
      id: project.id,
      slug: project.slug,
      title: project.title,
      summary: project.summary,
      projectType: project.projectType,
      number: String(index + 1).padStart(2, "0"),
      host: projectHost(project.demoUrl),
      demoUrl: safeExternalUrl(project.demoUrl),
      preview: preview ? { id: preview.id, altText: preview.altText } : null,
    };
  });
  return (
    <>
      <Desktop>
        <Blob shape="pill" style={{ left: 760, top: 720 }} />
        <Blob shape="circle" style={{ right: -90, top: -110 }} />
        <ProjectExplorer
          projects={items}
          filters={projectFilters(projects, explorer("filterAll"))}
        />
        {items.length > 0 && (
          <StickyNote
            id="nota-proyectos"
            title={t("noteTitle")}
            tilt={3}
            stack="derecha"
            delay={0.3}
            defaultPosition={{ x: 1020, y: 700 }}
          >
            <p>{t("noteText")}</p>
            <Link href="/contacto">{t("noteLink")}</Link>
          </StickyNote>
        )}
      </Desktop>
      <Ticker
        items={[
          ...projects.map((project) => project.title),
          ...(projects.length > 0
            ? [t("tickerCount", { count: projects.length })]
            : []),
        ]}
      />
    </>
  );
}
