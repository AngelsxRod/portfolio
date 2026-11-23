import type { Metadata } from "next";
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

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Proyectos | angel.os" };

export default async function ProjectsPage() {
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
        <ProjectExplorer projects={items} filters={projectFilters(projects)} />
        {items.length > 0 && (
          <StickyNote
            id="nota-proyectos"
            title="¿Te gustó alguno?"
            tilt={3}
            stack="derecha"
            delay={0.3}
            defaultPosition={{ x: 1020, y: 700 }}
          >
            <p>Puedo hacer algo así para tu negocio.</p>
            <Link href="/contacto">Escríbeme →</Link>
          </StickyNote>
        )}
      </Desktop>
      <Ticker
        items={[
          ...projects.map((project) => project.title),
          ...(projects.length > 0
            ? [`${projects.length} sitios en línea`]
            : []),
        ]}
      />
    </>
  );
}
