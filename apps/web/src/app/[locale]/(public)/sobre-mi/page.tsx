import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import "@/styles/os/about.css";
import { getPublicProfile } from "@/lib/public-profile";
import { getPublicSkills } from "@/lib/public-skills";
import { Blob } from "@/components/os/decor";
import { Desktop } from "@/components/os/desktop";
import { Terminal } from "@/components/os/terminal";
import { Ticker } from "@/components/os/ticker";
import { Window } from "@/components/os/window";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "/sobre-mi", "about");
}

export default async function AboutPage() {
  const [t, nav] = await Promise.all([
    getTranslations("about"),
    getTranslations("nav"),
  ]);
  const [profile, skills] = await Promise.all([
    getPublicProfile(),
    getPublicSkills(),
  ]);
  const categories = [...Map.groupBy(skills, (skill) => skill.category)];
  const subtitle =
    [profile?.headline, profile?.location].filter(Boolean).join(" · ") || null;

  return (
    <>
      <Desktop>
        <Blob shape="pill" style={{ left: 380, top: 760 }} />
        <Blob shape="ring" style={{ left: 1260, top: 640 }} />

        <Window
          id="terminal"
          title={nav("about")}
          file="terminal"
          stack="izquierda"
          labelledBy="page-title"
          defaultPosition={{ x: 40, y: 36 }}
          width={820}
        >
          <Terminal
            name={profile?.displayName ?? nav("about")}
            subtitle={subtitle}
            bio={profile?.presentation ?? null}
          />
        </Window>

        <Window
          id="paquetes"
          title={t("skillsTitle")}
          file="paquetes_instalados"
          stack="derecha"
          variant="orange"
          defaultPosition={{ x: 900, y: 36 }}
          width={500}
          delay={0.15}
        >
          {categories.length > 0 ? (
            <div className="os-pkgs">
              {categories.map(([category, items]) => (
                <section key={category} aria-label={category}>
                  <h3>
                    {category} <span>({items.length})</span>
                  </h3>
                  <ul>
                    {items.map((skill) => (
                      <li key={skill.id} className="os-pkg">
                        {skill.name}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <p className="os-empty">
              <strong>{t("emptyTitle")}</strong>
              {t("emptyText")}
            </p>
          )}
        </Window>
      </Desktop>
      <Ticker items={categories.map(([category]) => category)} />
    </>
  );
}
