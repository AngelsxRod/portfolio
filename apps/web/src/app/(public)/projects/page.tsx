import { getPublicProjects } from "@/lib/public-projects";
import {
  PublicFooter,
  PublicHeader,
  ProjectCard,
} from "@/components/public-site";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getPublicProjects();
  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="projects" />
      <main id="contenido" className="page-frame archive-main">
        <header className="archive-header">
          <p className="folio-caption">Portafolio</p>
          <h1 className="display-title">Proyectos</h1>
          <p className="archive-intro">
            Sitios y aplicaciones que ayudan a negocios reales a presentarse,
            vender y crecer. Visita cada sitio o conoce cómo lo resolví.
          </p>
        </header>
        <section aria-label="Listado de proyectos">
          {projects.length === 0 ? (
            <div className="empty-panel">
              <h2>Aún no hay proyectos publicados</h2>
              <p>Pronto compartiré aquí los proyectos terminados.</p>
            </div>
          ) : (
            <div className="project-grid">
              {projects.map((project) => (
                <ProjectCard
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
