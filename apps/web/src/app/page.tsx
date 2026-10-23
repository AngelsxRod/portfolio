import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { getPublicProjects } from "@/lib/public-projects";
import {
  PublicFooter,
  PublicHeader,
  ProjectCard,
} from "@/components/public-site";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await getPublicProjects();

  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="home" />
      <main id="contenido">
        <section className="hero-shell page-frame" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="folio-caption">Portafolio / proyectos publicados</p>
            <h1 id="hero-title" className="display-title">
              Ideas claras.
              <br />
              Trabajo visible.
            </h1>
            <p className="hero-intro">
              Una selección de proyectos y decisiones de diseño y desarrollo.
              Cada caso reúne su contexto y los detalles disponibles.
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/projects" />}
              size="lg"
            >
              Explorar proyectos
            </Button>
          </div>
          <div className="hero-mark" aria-hidden="true">
            <span className="hero-mark-line hero-mark-line-a" />
            <span className="hero-mark-line hero-mark-line-b" />
            <span className="hero-mark-disc" />
            <span className="hero-mark-corner" />
          </div>
        </section>

        <section className="page-frame home-work" aria-labelledby="work-title">
          <div className="section-heading">
            <div>
              <p className="folio-caption">Archivo público</p>
              <h2 id="work-title" className="section-title">
                Trabajo seleccionado
              </h2>
            </div>
            <p className="section-aside">
              Proyectos publicados, presentados con el contenido disponible.
            </p>
          </div>
          {projects.length > 0 ? (
            <div className="project-grid">
              {projects.slice(0, 3).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="empty-panel">
              <h3>Aún no hay proyectos publicados</h3>
              <p>
                El archivo aparecerá aquí cuando haya proyectos disponibles.
              </p>
            </div>
          )}
          {projects.length > 3 && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/projects" />}
            >
              Ver todos los proyectos
            </Button>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
