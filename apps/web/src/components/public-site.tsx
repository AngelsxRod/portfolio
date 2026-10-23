import Image from "next/image";
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
            <Link href="/#habilidades">Habilidades</Link>
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

export function ProjectCard({
  project,
  headingLevel = "h3",
}: {
  project: PublishedProject;
  headingLevel?: "h2" | "h3";
}) {
  const preview =
    project.media.find((image) => image.id === project.featuredMediaId) ??
    project.media[0];
  const title = <Link href={`/projects/${project.slug}`}>{project.title}</Link>;
  return (
    <article className="project-card">
      <Link
        href={`/projects/${project.slug}`}
        className="project-card-visual"
        tabIndex={-1}
        aria-hidden="true"
      >
        {preview ? (
          <div className="relative h-full w-full">
            <Image
              src={`/api/projects/media/${preview.id}`}
              alt={preview.altText}
              fill
              unoptimized
              sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 610px"
              className="object-cover object-top"
            />
          </div>
        ) : (
          <div className="project-card-typography">
            <span>{project.title}</span>
            <span className="project-card-monogram" aria-hidden="true">
              {project.title.slice(0, 1)}
            </span>
          </div>
        )}
      </Link>
      <div className="project-card-copy">
        {project.technologies.length > 0 && (
          <ul
            aria-label={`Tecnologías de ${project.title}`}
            className="technology-list project-card-tags"
          >
            {project.technologies.map((technology) => (
              <li key={technology}>
                <Badge
                  variant="default"
                  className="rounded-none px-2 py-0.5 text-xs"
                >
                  {technology}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        {headingLevel === "h2" ? <h2>{title}</h2> : <h3>{title}</h3>}
        <p>{project.summary}</p>
      </div>
      <div className="project-card-meta">
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
