import { getPublicProjects } from "@/lib/public-projects";
import {
  PublicFooter,
  PublicHeader,
  ProjectRow,
} from "@/components/public-site";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getPublicProjects();
  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="projects" />
      <main id="contenido" className="page-frame archive-main">
        <header className="archive-header">
          <p className="folio-caption">Archivo público</p>
          <h1 className="display-title">Proyectos</h1>
          <p className="archive-intro">
            Una mirada a los proyectos publicados, su propósito y las decisiones
            detrás de cada uno.
          </p>
        </header>
        <section aria-label="Listado de proyectos">
          {projects.length === 0 ? (
            <div className="empty-panel">
              <h2>Aún no hay proyectos publicados</h2>
              <p>
                Cuando haya proyectos disponibles, aparecerán en este archivo.
              </p>
            </div>
          ) : (
            <div className="project-list">
              {projects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  headingLevel="h2"
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
