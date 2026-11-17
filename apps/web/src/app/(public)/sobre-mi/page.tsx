import type { Metadata } from "next";
import { getPublicProfile } from "@/lib/public-profile";
import { getPublicSkills } from "@/lib/public-skills";
import { PublicFooter, PublicHeader } from "@/components/public-site";
import { EmptyPanel, PageHeader, SkillsList } from "@/components/public-lists";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sobre mí | Portafolio" };

export default async function AboutPage() {
  const [profile, skills] = await Promise.all([
    getPublicProfile(),
    getPublicSkills(),
  ]);
  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="about" />
      <main id="contenido" className="page-frame archive-main">
        <PageHeader
          caption={profile?.location ?? "Perfil"}
          title={profile?.displayName ?? "Sobre mí"}
          intro={
            profile?.headline ?? "Quién soy y con qué tecnologías trabajo."
          }
        />
        <section aria-labelledby="presentation-title" className="about-intro">
          <h2 id="presentation-title" className="section-title">
            Presentación
          </h2>
          {profile ? (
            <div>
              <p className="hero-intro whitespace-pre-line">
                {profile.presentation}
              </p>
              {profile.links.length > 0 && (
                <ul className="profile-links">
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
            </div>
          ) : (
            <EmptyPanel title="Aún no hay un perfil publicado">
              Aparecerá aquí cuando se publique desde el panel.
            </EmptyPanel>
          )}
        </section>
        <section aria-labelledby="skills-title" className="about-skills">
          <div className="section-heading">
            <h2 id="skills-title" className="section-title">
              Habilidades
            </h2>
            <p className="section-aside">En qué te puedo ayudar.</p>
          </div>
          {skills.length > 0 ? (
            <SkillsList skills={skills} />
          ) : (
            <EmptyPanel title="Aún no hay habilidades publicadas">
              Aparecerán aquí cuando se publiquen desde el panel.
            </EmptyPanel>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
