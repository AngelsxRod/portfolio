import type { Metadata } from "next";
import "@/styles/os/project.css";
import { Badge } from "@repo/ui/components/badge";
import {
  getPublicProject,
  getPublicProjects,
  getRelatedProjects,
} from "@/lib/public-projects";
import {
  projectHost,
  projectPreview,
  splitNotesSections,
} from "@/lib/os/projects";
import { safeExternalUrl } from "@/lib/safe-url";
import { Blob } from "@/components/os/decor";
import { Desktop } from "@/components/os/desktop";
import { OsLinkButton } from "@/components/os/os-button";
import { ProjectBrowser } from "@/components/os/project-browser";
import { ProjectMarkdown } from "@/components/os/project-markdown";
import { ProjectThumb } from "@/components/os/project-thumb";
import { Ticker } from "@/components/os/ticker";
import { Window } from "@/components/os/window";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProject(slug);
  return { title: `${project.title} | angel.os`, description: project.summary };
}

export default async function ProjectDetail({ params }: Props) {
  const { slug } = await params;
  const [project, all, related] = await Promise.all([
    getPublicProject(slug),
    getPublicProjects(),
    getRelatedProjects(slug),
  ]);
  const images = [
    ...project.media.filter((image) => image.id === project.featuredMediaId),
    ...project.media.filter((image) => image.id !== project.featuredMediaId),
  ].map(({ id, altText }) => ({ id, altText }));
  const position = all.findIndex((item) => item.id === project.id);
  const demoUrl = safeExternalUrl(project.demoUrl);
  const codeUrl = safeExternalUrl(project.codeUrl);
  const host = projectHost(project.demoUrl);
  const notes = splitNotesSections(project.description);
  const facts = (
    [
      ["tipo", project.projectType],
      ["año", project.projectYear],
      ["rol", project.projectRole],
    ] satisfies [string, string | null][]
  ).filter((fact): fact is [string, string] => Boolean(fact[1]));

  return (
    <>
      <Desktop>
        <Blob shape="ring" style={{ left: 1240, top: 20 }} />

        <ProjectBrowser
          slug={project.slug}
          title={project.title}
          host={host}
          demoUrl={demoUrl}
          images={images}
        />

        <Window
          id="ficha"
          title="Ficha del proyecto"
          file="ficha.info"
          stack="derecha"
          labelledBy="project-title"
          variant="orange"
          defaultPosition={{ x: 980, y: 36 }}
          width={420}
          delay={0.12}
        >
          <div className="os-info">
            {position >= 0 && (
              <span className="os-info-kicker">
                proyecto {String(position + 1).padStart(2, "0")} de{" "}
                {String(all.length).padStart(2, "0")}
              </span>
            )}
            <h1 id="project-title" className="os-display">
              {project.title}
            </h1>
            <p className="os-info-summary">{project.summary}</p>
            {facts.length > 0 && (
              <dl className="os-info-facts">
                {facts.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {project.technologies.length > 0 && (
              <div>
                <h2 className="os-info-label">tecnologías</h2>
                <ul className="os-tech">
                  {project.technologies.map((technology) => (
                    <li key={technology}>
                      <Badge variant="outline" className="os-badge">
                        {technology}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="os-actions">
              {demoUrl && (
                <OsLinkButton href={demoUrl} external>
                  Abrir sitio ↗
                </OsLinkButton>
              )}
              {codeUrl && (
                <OsLinkButton href={codeUrl} variant="outline" external>
                  Ver código ↗
                </OsLinkButton>
              )}
              <OsLinkButton href="/projects" variant="outline">
                ← Todos los proyectos
              </OsLinkButton>
            </div>
          </div>
        </Window>

        <Window
          id="notas"
          title="De qué trata"
          file="notas.md"
          stack="pie"
          defaultPosition={{ x: 40, y: 800 }}
          width={1360}
          delay={0.24}
        >
          <article className="os-notes" aria-label="Descripción del proyecto">
            {notes.intro && (
              <section className="os-notes-intro">
                {notes.intro.heading && <h2>{notes.intro.heading}</h2>}
                <ProjectMarkdown>{notes.intro.body}</ProjectMarkdown>
              </section>
            )}
            {notes.sections.length > 0 && (
              <div className="os-notes-grid">
                {notes.sections.map((section, index) => (
                  <section key={index} className="os-notes-card">
                    <h2>{section.heading}</h2>
                    <ProjectMarkdown>{section.body}</ProjectMarkdown>
                  </section>
                ))}
              </div>
            )}
          </article>
        </Window>

        {related.length > 0 && (
          <Window
            id="otros"
            title="Otros proyectos"
            file="~/proyectos"
            stack="pie"
            variant="orange"
            defaultPosition={{ x: 40, y: 1200 }}
            width={1360}
            delay={0.32}
          >
            <nav className="os-related" aria-label="Otros proyectos">
              <ul className="os-cards">
                {related.map((item) => {
                  const preview = projectPreview(item);
                  return (
                    <li key={item.id}>
                      <ProjectThumb
                        project={{
                          slug: item.slug,
                          title: item.title,
                          projectType: item.projectType,
                          preview: preview
                            ? { id: preview.id, altText: preview.altText }
                            : null,
                        }}
                        sizes="(max-width: 820px) 100vw, 420px"
                      />
                    </li>
                  );
                })}
              </ul>
              <div className="os-related-foot">
                <OsLinkButton href="/projects" variant="outline">
                  ← Todos los proyectos
                </OsLinkButton>
              </div>
            </nav>
          </Window>
        )}
      </Desktop>
      <Ticker
        items={[
          project.title,
          ...(project.projectType ? [project.projectType] : []),
          ...project.technologies,
          ...(host ? [host] : []),
        ]}
      />
    </>
  );
}
