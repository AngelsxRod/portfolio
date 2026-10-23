import Link from "next/link";
import Markdown from "react-markdown";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { getPublicProject } from "@/lib/public-projects";
import { PublicFooter, PublicHeader } from "@/components/public-site";

export const dynamic = "force-dynamic";

function safeExternalUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getPublicProject(slug);
  const demoUrl = safeExternalUrl(project.demoUrl);
  const codeUrl = safeExternalUrl(project.codeUrl);
  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="projects" />
      <main id="contenido" className="page-frame detail-main">
        <Link href="/projects" className="back-link">
          ← Volver a proyectos
        </Link>
        <header className="detail-header">
          <p className="folio-caption">Proyecto publicado</p>
          <h1 className="display-title">{project.title}</h1>
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
                  Ver sitio
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
                  Ver código
                </Button>
              )}
            </div>
          )}
        </header>
        <div
          className={
            project.technologies.length > 0
              ? "detail-content"
              : "detail-content detail-content-single"
          }
        >
          {project.technologies.length > 0 && (
            <aside className="detail-aside" aria-label="Datos del proyecto">
              <h2>Ficha del proyecto</h2>
              <div>
                <h3>Tecnologías</h3>
                <ul className="technology-list" aria-label="Tecnologías">
                  {project.technologies.map((technology) => (
                    <li key={technology}>
                      <Badge variant="secondary">{technology}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
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
      </main>
      <PublicFooter />
    </div>
  );
}
