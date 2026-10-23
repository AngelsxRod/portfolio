import Link from "next/link";
import { Badge } from "@repo/ui/components/badge";
import type { PublishedProject } from "@/lib/drafts";

export function PublicHeader({ current }: { current?: "home" | "projects" }) {
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="public-header">
        <div className="page-frame header-inner">
          <Link className="brand-link" href="/" aria-label="Portafolio, inicio">
            <span className="brand-symbol" aria-hidden="true">
              P<span>/</span>
            </span>
            <span>Portafolio</span>
          </Link>
          <nav aria-label="Navegación principal" className="header-nav">
            <Link
              href="/"
              aria-current={current === "home" ? "page" : undefined}
            >
              Inicio
            </Link>
            <Link
              href="/projects"
              aria-current={current === "projects" ? "page" : undefined}
            >
              Proyectos
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="page-frame footer-inner">
        <span>Portafolio</span>
        <span>Proyectos y procesos documentados.</span>
        <Link href="/projects">Ver proyectos</Link>
      </div>
    </footer>
  );
}

export function ProjectRow({
  project,
  headingLevel = "h3",
}: {
  project: PublishedProject;
  headingLevel?: "h2" | "h3";
}) {
  const title = <Link href={`/projects/${project.slug}`}>{project.title}</Link>;
  return (
    <article className="project-row">
      <div className="project-row-main">
        {headingLevel === "h2" ? <h2>{title}</h2> : <h3>{title}</h3>}
        <p>{project.summary}</p>
      </div>
      <div className="project-row-meta">
        {project.technologies.length > 0 && (
          <ul
            aria-label={`Tecnologías de ${project.title}`}
            className="technology-list"
          >
            {project.technologies.map((technology) => (
              <li key={technology}>
                <Badge variant="secondary">{technology}</Badge>
              </li>
            ))}
          </ul>
        )}
        <Link
          className="text-link"
          href={`/projects/${project.slug}`}
          aria-label={`Ver proyecto ${project.title}`}
        >
          Ver proyecto <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}
