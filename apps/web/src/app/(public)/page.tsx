import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { getPublicProjects } from "@/lib/public-projects";
import { getPublicProfile } from "@/lib/public-profile";
import {
  PublicFooter,
  PublicHeader,
  ProjectRow,
} from "@/components/public-site";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [projects, profile] = await Promise.all([
    getPublicProjects(),
    getPublicProfile(),
  ]);
  const facts = [
    ["servicio", profile?.headline],
    ["ubicación", profile?.location],
    ["contacto", profile?.email],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));

  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="home" />
      <main id="contenido">
        <section
          id="perfil"
          className={`hero-shell page-frame${facts.length === 0 ? " hero-shell-single" : ""}`}
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
                  Portafolio / Soluciones para tu negocio
                </p>
                <h1 id="hero-title" className="display-title">
                  Tu idea,
                  <br />
                  convertida en un sitio que vende.
                </h1>
                <p className="hero-intro">
                  Diseño y desarrollo sitios web claros, rápidos y listos para
                  atraer clientes. Mira lo que he construido y cuéntame qué
                  necesitas.
                </p>
              </>
            )}
            <div className="hero-actions">
              <Button
                nativeButton={false}
                render={<Link href="/projects" />}
                size="lg"
              >
                Ver mis proyectos
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/contacto" />}
                size="lg"
              >
                Contacto
              </Button>
            </div>
          </div>
          {facts.length > 0 && (
            <div className="hero-card" aria-label="Datos del perfil">
              <div className="hero-card-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <dl>
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>

        <section className="page-frame home-work" aria-labelledby="work-title">
          <div className="section-heading">
            <div>
              <p className="folio-caption">Proyectos</p>
              <h2 id="work-title" className="section-title">
                Soluciones que he entregado
              </h2>
            </div>
            <p className="section-aside">
              Resultados reales, listos para ver y probar.
            </p>
          </div>
          {projects.length > 0 ? (
            <div className="project-list">
              {projects.slice(0, 6).map((project, index) => (
                <ProjectRow key={project.id} project={project} index={index} />
              ))}
            </div>
          ) : (
            <div className="empty-panel">
              <h3>Aún no hay proyectos publicados</h3>
              <p>Pronto compartiré aquí los proyectos terminados.</p>
            </div>
          )}
          {projects.length > 6 && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/projects" />}
            >
              Ver todos los proyectos
            </Button>
          )}
        </section>
        <section
          className="page-frame home-sections"
          aria-labelledby="explore-title"
        >
          <h2 id="explore-title" className="section-title">
            Conoce más
          </h2>
          <ul className="home-section-list">
            {[
              ["/sobre-mi", "Sobre mí", "Quién soy y en qué te puedo ayudar."],
              [
                "/experiencia",
                "Trayectoria",
                "Experiencia y formación que respaldan mi trabajo.",
              ],
              [
                "/contacto",
                "Contacto",
                "Cuéntame qué necesitas y te propongo una solución.",
              ],
            ].map(([href, title, text]) => (
              <li key={href}>
                <Link href={href}>
                  <span className="home-section-title">{title}</span>
                  <span className="home-section-text">{text}</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section
          className="page-frame home-sections"
          aria-labelledby="cta-title"
        >
          <div className="contact-cta">
            <h2 id="cta-title" className="section-title">
              Hablemos de tu próximo proyecto
            </h2>
            <p>Recibe una propuesta a la medida de tu negocio.</p>
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/contacto" />}
            >
              Cotiza tu proyecto
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
