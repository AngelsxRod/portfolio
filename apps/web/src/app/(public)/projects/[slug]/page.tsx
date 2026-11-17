import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/os/project.css";
import { Badge } from "@repo/ui/components/badge";
import {
  getPublicProject,
  getPublicProjects,
  getRelatedProjects,
} from "@/lib/public-projects";
import { projectHost } from "@/lib/os/projects";
import { safeExternalUrl } from "@/lib/safe-url";
import { Blob } from "@/components/os/decor";
import { Desktop } from "@/components/os/desktop";
import { OsLinkButton } from "@/components/os/os-button";
import { ProjectBrowser } from "@/components/os/project-browser";
import { ProjectMarkdown } from "@/components/os/project-markdown";
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
        <Blob shape="circle" style={{ left: 860, top: 600 }} />
        <Blob shape="ring" style={{ left: 1240, top: 20 }} />

        <ProjectBrowser
          title={project.title}
          host={host}
          demoUrl={demoUrl}
          images={images}
        />

        <Window
          id="ficha"
          title="Ficha del proyecto"
          file={`${project.title.toLowerCase().replace(/\s+/g, "_")}.info`}
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
          stack="derecha"
          defaultPosition={{ x: 990, y: 500 }}
          width={420}
          delay={0.24}
        >
          <article className="os-notes" aria-label="Descripción del proyecto">
            <ProjectMarkdown>{project.description}</ProjectMarkdown>
            {related.length > 0 && (
              <nav className="os-related" aria-label="Otros proyectos">
                <p className="os-info-label">otros proyectos</p>
                <ul>
                  {related.map((item) => (
                    <li key={item.id}>
                      <Link className="os-link" href={`/projects/${item.slug}`}>
                        {item.title} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </article>
        </Window>
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
