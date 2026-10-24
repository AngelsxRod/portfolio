import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { PublicFooter, PublicHeader } from "@/components/public-site";
import { PageHeader } from "@/components/public-lists";
import { getPublicProfile } from "@/lib/public-profile";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contacto | Portafolio" };

export default async function ContactPage() {
  const profile = await getPublicProfile();
  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="contact" />
      <main id="contenido" className="page-frame archive-main">
        <PageHeader
          caption="Contacto"
          title="Hablemos"
          intro="Cuéntame qué necesitas y te respondo con una propuesta."
        />
        <div className="contact-layout">
          <section aria-labelledby="form-title" className="contact-card">
            <h2 id="form-title">Envíame un mensaje</h2>
            <ContactForm siteKey={process.env.TURNSTILE_SITE_KEY || null} />
          </section>
          {profile && (profile.email || profile.links.length > 0) && (
            <aside aria-labelledby="direct-title" className="contact-aside">
              <h2 id="direct-title">También puedes encontrarme en</h2>
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
            </aside>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
