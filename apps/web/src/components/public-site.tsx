import Image from "next/image";
import Link from "next/link";
import { Badge } from "@repo/ui/components/badge";
import type { PublishedProject } from "@/lib/drafts";
import { ThemeToggle } from "@/components/theme-toggle";

export type PublicPage =
  "home" | "projects" | "about" | "experience" | "education" | "contact";

const navigation: { page: PublicPage; href: string; label: string }[] = [
  { page: "home", href: "/", label: "Inicio" },
  { page: "projects", href: "/projects", label: "Proyectos" },
  { page: "about", href: "/sobre-mi", label: "Sobre mí" },
  { page: "experience", href: "/experiencia", label: "Experiencia" },
  { page: "education", href: "/educacion", label: "Educación" },
  { page: "contact", href: "/contacto", label: "Contacto" },
];

export function PublicHeader({ current }: { current?: PublicPage }) {
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
          <div className="header-tools">
            <nav aria-label="Navegación principal" className="header-nav">
              {navigation.map(({ page, href, label }) => (
                <Link
                  key={page}
                  href={href}
                  aria-current={current === page ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <ThemeToggle />
          </div>
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
        <Link href="/contacto">Contacto</Link>
      </div>
    </footer>
  );
}

export function ProjectRow({
  project,
  index,
}: {
  project: PublishedProject;
  index: number;
}) {
  return (
    <article className="project-row">
      <span className="project-row-index">
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3>
        <Link href={`/projects/${project.slug}`}>{project.title}</Link>
      </h3>
      <ul
        aria-label={`Tecnologías de ${project.title}`}
        className="technology-list"
      >
        {project.technologies.slice(0, 4).map((technology) => (
          <li key={technology}>
            <Badge variant="outline" className="font-mono text-xs">
              {technology}
            </Badge>
          </li>
        ))}
      </ul>
      <Link
        className="text-link"
        href={`/projects/${project.slug}`}
        aria-label={`Ver proyecto ${project.title}`}
      >
        Ver proyecto <span aria-hidden="true">↗</span>
      </Link>
    </article>
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
                  className="px-2 py-0.5 font-mono text-xs"
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
