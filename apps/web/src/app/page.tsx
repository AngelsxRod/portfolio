import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { getPublicProjects } from "@/lib/public-projects";
import { getPublicExperience } from "@/lib/public-experience";
import { educationLevels } from "@/lib/education";
import { formatMonth } from "@/lib/experience";
import { getPublicProfile } from "@/lib/public-profile";
import { getPublicCertificates } from "@/lib/public-certificates";
import { getPublicEducation } from "@/lib/public-education";
import { getPublicSkills } from "@/lib/public-skills";
import {
  PublicFooter,
  PublicHeader,
  ProjectCard,
} from "@/components/public-site";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [projects, skills, experience, education, certificates, profile] =
    await Promise.all([
      getPublicProjects(),
      getPublicSkills(),
      getPublicExperience(),
      getPublicEducation(),
      getPublicCertificates(),
      getPublicProfile(),
    ]);
  const categories = Map.groupBy(skills, (skill) => skill.category);

  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="home" />
      <main id="contenido">
        <section
          id="perfil"
          className="hero-shell page-frame"
          aria-labelledby="hero-title"
        >
          <div className="hero-copy">
            {profile ? (
              <>
                <p className="folio-caption">
                  {profile.location ?? "Portafolio"}
                </p>
                <h1 id="hero-title" className="display-title hero-name">
                  {profile.displayName}
                </h1>
                {profile.headline && (
                  <p className="hero-role">{profile.headline}</p>
                )}
                <p className="hero-intro whitespace-pre-line">
                  {profile.presentation}
                </p>
                {(profile.email || profile.links.length > 0) && (
                  <ul className="profile-links">
                    {profile.email && (
                      <li>
                        <a href={`mailto:${profile.email}`}>{profile.email}</a>
                      </li>
                    )}
                    {profile.links.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.label}
                          <span className="sr-only">
                            {" "}
                            (se abre en otra pestaña)
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <p className="folio-caption">
                  Portafolio / proyectos publicados
                </p>
                <h1 id="hero-title" className="display-title">
                  Ideas claras.
                  <br />
                  Trabajo visible.
                </h1>
                <p className="hero-intro">
                  Una selección de proyectos y decisiones de diseño y
                  desarrollo. Cada caso reúne su contexto y los detalles
                  disponibles.
                </p>
              </>
            )}
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
      <section
        id="habilidades"
        className="page-frame skills-section"
        aria-labelledby="skills-title"
      >
        <div className="section-heading">
          <div>
            <p className="folio-caption">Archivo público</p>
            <h2 id="skills-title" className="section-title">
              Habilidades
            </h2>
          </div>
          <p className="section-aside">
            Agrupadas por categoría, según lo publicado.
          </p>
        </div>
        {skills.length > 0 ? (
          <dl className="skills-list">
            {[...categories].map(([category, items]) => (
              <div key={category} className="skills-group">
                <dt>{category}</dt>
                <dd>
                  <ul>
                    {items.map((skill) => (
                      <li key={skill.id}>{skill.name}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="empty-panel">
            <h3>Aún no hay habilidades publicadas</h3>
            <p>Aparecerán aquí cuando se publiquen desde el panel.</p>
          </div>
        )}
      </section>
      <section
        id="experiencia"
        className="page-frame experience-section"
        aria-labelledby="experience-title"
      >
        <div className="section-heading">
          <div>
            <p className="folio-caption">Archivo público</p>
            <h2 id="experience-title" className="section-title">
              Experiencia
            </h2>
          </div>
          <p className="section-aside">
            Cargos publicados, ordenados por posición y por fecha de inicio.
          </p>
        </div>
        {experience.length > 0 ? (
          <ol className="experience-list">
            {experience.map((item) => (
              <li key={item.id}>
                <article className="experience-entry">
                  <p className="experience-period">
                    <time dateTime={item.startDate}>
                      {formatMonth(item.startDate)}
                    </time>
                    {" – "}
                    {item.endDate ? (
                      <time dateTime={item.endDate}>
                        {formatMonth(item.endDate)}
                      </time>
                    ) : (
                      "Actual"
                    )}
                  </p>
                  <div className="experience-body">
                    <h3>{item.title}</h3>
                    <p className="experience-organization">
                      {item.organization}
                    </p>
                    {item.description && <p>{item.description}</p>}
                    {item.achievements.length > 0 && (
                      <ul className="experience-achievements">
                        {item.achievements.map((achievement) => (
                          <li key={achievement}>{achievement}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty-panel">
            <h3>Aún no hay experiencia publicada</h3>
            <p>Aparecerá aquí cuando se publique desde el panel.</p>
          </div>
        )}
      </section>
      <section
        id="educacion"
        className="page-frame experience-section"
        aria-labelledby="education-title"
      >
        <div className="section-heading">
          <div>
            <p className="folio-caption">Archivo público</p>
            <h2 id="education-title" className="section-title">
              Educación
            </h2>
          </div>
          <p className="section-aside">
            Estudios publicados, ordenados por posición y por fecha de inicio.
          </p>
        </div>
        {education.length > 0 ? (
          <ol className="experience-list">
            {education.map((item) => (
              <li key={item.id}>
                <article className="experience-entry">
                  <p className="experience-period">
                    <time dateTime={item.startDate}>
                      {formatMonth(item.startDate)}
                    </time>
                    {" – "}
                    {item.endDate ? (
                      <time dateTime={item.endDate}>
                        {formatMonth(item.endDate)}
                      </time>
                    ) : (
                      "En curso"
                    )}
                  </p>
                  <div className="experience-body">
                    <p className="education-level">
                      {educationLevels[item.level]}
                    </p>
                    <h3>{item.program}</h3>
                    <p className="experience-organization">
                      {item.institution}
                    </p>
                    {item.description && <p>{item.description}</p>}
                  </div>
                </article>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty-panel">
            <h3>Aún no hay educación publicada</h3>
            <p>Aparecerá aquí cuando se publique desde el panel.</p>
          </div>
        )}
      </section>
      <section
        id="certificados"
        className="page-frame experience-section"
        aria-labelledby="certificates-title"
      >
        <div className="section-heading">
          <div>
            <p className="folio-caption">Archivo público</p>
            <h2 id="certificates-title" className="section-title">
              Certificados
            </h2>
          </div>
          <p className="section-aside">
            Certificados y diplomas publicados, ordenados por posición y por
            fecha de emisión.
          </p>
        </div>
        {certificates.length > 0 ? (
          <ol className="experience-list">
            {certificates.map((item) => (
              <li key={item.id}>
                <article className="experience-entry">
                  <p className="experience-period">
                    <time dateTime={item.issueDate}>
                      {formatMonth(item.issueDate)}
                    </time>
                  </p>
                  <div className="experience-body">
                    <h3>{item.name}</h3>
                    <p className="experience-organization">{item.issuer}</p>
                    {item.description && <p>{item.description}</p>}
                    {item.verificationUrl && (
                      <p>
                        <a
                          href={item.verificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-4"
                        >
                          Verificar certificado
                          <span className="sr-only">
                            {" "}
                            (se abre en otra pestaña)
                          </span>
                        </a>
                      </p>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty-panel">
            <h3>Aún no hay certificados publicados</h3>
            <p>Aparecerán aquí cuando se publiquen desde el panel.</p>
          </div>
        )}
      </section>
      <PublicFooter />
    </div>
  );
}
