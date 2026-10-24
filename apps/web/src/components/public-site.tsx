import Image from "next/image";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import type { PublishedProject } from "@/lib/drafts";
import { safeExternalUrl } from "@/lib/safe-url";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export type PublicPage =
  "home" | "projects" | "about" | "experience" | "contact";

const navigation: { page: PublicPage; href: string; label: string }[] = [
  { page: "home", href: "/", label: "Inicio" },
  { page: "projects", href: "/projects", label: "Proyectos" },
  { page: "about", href: "/sobre-mi", label: "Sobre mí" },
  { page: "experience", href: "/experiencia", label: "Trayectoria" },
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
            <MobileNav items={navigation} current={current} />
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
      <p className="project-row-summary line-clamp-2">{project.summary}</p>
      <Link
        className="text-link"
        href={`/projects/${project.slug}`}
        aria-label={`Ver detalle de ${project.title}`}
      >
        Ver detalle <span aria-hidden="true">↗</span>
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
  const demoUrl = safeExternalUrl(project.demoUrl);
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
        {headingLevel === "h2" ? <h2>{title}</h2> : <h3>{title}</h3>}
        <p>{project.summary}</p>
      </div>
      <div className="project-card-meta">
        {demoUrl && (
          <Button
            nativeButton={false}
            render={
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ver sitio de ${project.title}`}
              />
            }
          >
            Ver sitio en vivo <span aria-hidden="true">↗</span>
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </Button>
        )}
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link
              href={`/projects/${project.slug}`}
              aria-label={`Ver detalle de ${project.title}`}
            />
          }
        >
          Ver detalle del proyecto
        </Button>
      </div>
    </article>
  );
}
