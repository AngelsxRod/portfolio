import Link from "next/link";
import { ProjectCarousel } from "@/components/project-carousel";
import Markdown from "react-markdown";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { getPublicProject } from "@/lib/public-projects";
import { safeExternalUrl } from "@/lib/safe-url";
import { PublicFooter, PublicHeader } from "@/components/public-site";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getPublicProject(slug);
  const heroImages = [
    ...project.media.filter((image) => image.id === project.featuredMediaId),
    ...project.media.filter((image) => image.id !== project.featuredMediaId),
  ];
  const demoUrl = safeExternalUrl(project.demoUrl);
  const codeUrl = safeExternalUrl(project.codeUrl);
  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="projects" />
      <main id="contenido" className="page-frame detail-main">
        <Link href="/projects" className="back-link">
          ← Volver a proyectos
        </Link>
        <header className="detail-header detail-header-gallery">
          <h1 className="display-title">{project.title}</h1>
          <div className="detail-intro-copy">
            <p className="folio-caption">De qué trata</p>
            <p className="detail-summary">{project.summary}</p>
            {(demoUrl || codeUrl) && (
              <div className="detail-actions">
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
                    Ver sitio en vivo
                  </Button>
                )}
                {codeUrl && (
                  <Button
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
                  </Button>
                )}
              </div>
            )}
          </div>
        </header>
        {heroImages.length > 0 && <ProjectCarousel images={heroImages} />}
        <div className="detail-content detail-content-single">
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
            {project.technologies.length > 0 && (
              <section className="detail-tech" aria-labelledby="tech-title">
                <h2 id="tech-title" className="detail-section-title">
                  Tecnologías utilizadas
                </h2>
                <ul className="technology-list" aria-label="Tecnologías">
                  {project.technologies.map((technology) => (
                    <li key={technology}>
                      <Badge variant="secondary">{technology}</Badge>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
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
                Ver sitio en vivo
              </Button>
            )}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
