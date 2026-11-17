import Link from "next/link";
import { ProjectCarousel } from "@/components/project-carousel";
import Markdown from "react-markdown";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { getPublicProject, getRelatedProjects } from "@/lib/public-projects";
import { safeExternalUrl } from "@/lib/safe-url";
import {
  ProjectCard,
  PublicFooter,
  PublicHeader,
} from "@/components/public-site";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, related] = await Promise.all([
    getPublicProject(slug),
    getRelatedProjects(slug),
  ]);
  const heroImages = [
    ...project.media.filter((image) => image.id === project.featuredMediaId),
    ...project.media.filter((image) => image.id !== project.featuredMediaId),
  ];
  const facts = (
    [
      ["Tipo", project.projectType],
      ["Año", project.projectYear],
      ["Rol", project.projectRole],
    ] satisfies [string, string | null][]
  ).filter((fact): fact is [string, string] => Boolean(fact[1]));
  const demoUrl = safeExternalUrl(project.demoUrl);
  const codeUrl = safeExternalUrl(project.codeUrl);
  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="projects" />
      <main id="contenido" className="page-frame detail-main">
        <Link href="/projects" className="back-link">
          ← Volver a proyectos
        </Link>
        <header
          className={`detail-hero${heroImages.length > 0 ? "" : " detail-hero-single"}`}
        >
          <div className="detail-hero-copy">
            <p className="folio-caption">Caso de estudio</p>
            <h1 className="display-title">{project.title}</h1>
            <p className="detail-summary">{project.summary}</p>
            {(demoUrl || codeUrl) && (
              <div className="detail-actions">
                {demoUrl && (
                  <Button
                    size="lg"
                    nativeButton={false}
                    render={
                      <a
                        href={demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    Ver sitio en vivo ↗
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </Button>
                )}
                {codeUrl && (
                  <Button
                    size="lg"
                    variant="outline"
                    nativeButton={false}
                    render={
                      <a
                        href={codeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    Ver código fuente
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </Button>
                )}
              </div>
            )}
          </div>
          {heroImages.length > 0 && (
            <div className="detail-hero-visual">
              <ProjectCarousel images={heroImages} />
            </div>
          )}
        </header>
        {project.technologies.length > 0 && (
          <section className="detail-tech" aria-labelledby="tech-title">
            <h2 id="tech-title" className="detail-tech-label">
              Tecnologías
            </h2>
            <ul className="technology-list">
              {project.technologies.map((technology) => (
                <li key={technology}>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {technology}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div
          className={`detail-content${facts.length > 0 || demoUrl ? "" : " detail-content-single"}`}
        >
          <div className="detail-body">
            <h2 className="detail-section-title">Sobre el proyecto</h2>
            <article
              className="project-prose"
              aria-label="Descripción del proyecto"
            >
              <Markdown
                components={{ h1: ({ children }) => <h2>{children}</h2> }}
                skipHtml
                allowedElements={[
                  "p",
                  "br",
                  "strong",
                  "em",
                  "del",
                  "blockquote",
                  "ul",
                  "ol",
                  "li",
                  "h1",
                  "h2",
                  "h3",
                  "h4",
                  "h5",
                  "h6",
                  "code",
                  "pre",
                  "a",
                  "hr",
                ]}
                urlTransform={(url) => {
                  if (url.startsWith("#")) return url;
                  if (
                    url.startsWith("/") &&
                    !url.startsWith("//") &&
                    !url.includes("\\")
                  )
                    return url;
                  return safeExternalUrl(url) ?? "";
                }}
              >
                {project.description}
              </Markdown>
            </article>
          </div>
          {(facts.length > 0 || demoUrl) && (
            <aside className="detail-aside" aria-labelledby="facts-title">
              <h2 id="facts-title">Ficha del proyecto</h2>
              {facts.length > 0 && (
                <dl>
                  {facts.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {demoUrl && (
                <Button
                  nativeButton={false}
                  render={
                    <a
                      href={demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Ver sitio en vivo ↗
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </Button>
              )}
            </aside>
          )}
        </div>
        {related.length > 0 && (
          <section
            className="detail-related"
            aria-labelledby="detail-related-title"
          >
            <h2 id="detail-related-title" className="section-title">
              Otros proyectos
            </h2>
            <div className="project-grid">
              {related.map((item) => (
                <ProjectCard key={item.id} project={item} headingLevel="h3" />
              ))}
            </div>
          </section>
        )}
        <section className="detail-cta" aria-labelledby="detail-cta-title">
          <h2 id="detail-cta-title" className="section-title">
            ¿Te interesa algo así para tu negocio?
          </h2>
          <p>Cuéntame qué necesitas y te respondo con una propuesta.</p>
          <div className="detail-actions">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/contacto" />}
            >
              Cotiza tu proyecto
            </Button>
            {demoUrl && (
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={
                  <a href={demoUrl} target="_blank" rel="noopener noreferrer" />
                }
              >
                Ver sitio en vivo ↗
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </Button>
            )}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
