import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import "@/styles/os/home.css";
import { getPublicProfile } from "@/lib/public-profile";
import { getPublicProjects } from "@/lib/public-projects";
import { getPublicSkills } from "@/lib/public-skills";
import { mediaUrl, projectPreview } from "@/lib/os/projects";
import { safeExternalUrl } from "@/lib/safe-url";
import { BootScreen } from "@/components/os/boot-screen";
import { ProfileAvatar } from "@/components/os/avatar";
import { Blob, StickyNote } from "@/components/os/decor";
import { Desktop } from "@/components/os/desktop";
import { DesktopItem } from "@/components/os/desktop-item";
import { OsLinkButton } from "@/components/os/os-button";
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
  return pageMetadata(locale, "/", "home");
}

const shortcutIcons = {
  folder: (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="var(--os-lime)"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M5 12h14l4 5h20v22H5z" />
    </svg>
  ),
  text: (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="var(--os-bone)"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 5h17l9 9v29H12z" />
      <path d="M29 5v9h9M18 24h14M18 30h14M18 36h9" />
    </svg>
  ),
  mail: (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="var(--os-orange)"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="6" y="11" width="36" height="26" rx="3" />
      <path d="M6 14l18 12 18-12" />
    </svg>
  ),
  link: (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="var(--os-bone)"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M17 15l-9 9 9 9M31 15l9 9-9 9M27 11l-6 26" />
    </svg>
  ),
};

export default async function Home() {
  const [t, nav, common] = await Promise.all([
    getTranslations("home"),
    getTranslations("nav"),
    getTranslations("common"),
  ]);
  const [profile, projects, skills] = await Promise.all([
    getPublicProfile(),
    getPublicProjects(),
    getPublicSkills(),
  ]);
  const recent = projects
    .map((project) => ({ project, preview: projectPreview(project) }))
    .filter((item) => item.preview)
    .slice(0, 3);
  const links = (profile?.links ?? []).flatMap((link) => {
    const url = safeExternalUrl(link.url);
    return url ? [{ label: link.label, url }] : [];
  });
  const [firstName, ...restName] = (profile?.displayName ?? "angel.os").split(
    " ",
  );
  // El nombre llena la ventana sin partir palabras: Syne 800 mide ~0.9em por letra.
  const longestWord = Math.max(
    ...[firstName, ...restName].map((word) => word?.length ?? 0),
  );
  const heroSize = Math.min(104, Math.floor(580 / (0.9 * longestWord)));
  const facts: [string, React.ReactNode][] = [];
  if (profile) {
    facts.push([t("facts.name"), profile.displayName]);
    if (profile.headline) facts.push([t("facts.profile"), profile.headline]);
    if (profile.location) facts.push([t("facts.location"), profile.location]);
  }
  facts.push([
    t("facts.projects"),
    <span key="count" className="os-fact-strong">
      {t("facts.projectsValue", { count: projects.length })}
    </span>,
  ]);
  if (profile?.email)
    facts.push([
      t("facts.email"),
      <a key="mail" className="os-link" href={`mailto:${profile.email}`}>
        {profile.email}
      </a>,
    ]);
  for (const link of links)
    facts.push([
      link.label.toLowerCase(),
      <a
        key={link.url}
        className="os-link"
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {new URL(link.url).host.replace(/^www\./, "")} ↗
        <span className="sr-only"> {common("newTab")}</span>
      </a>,
    ]);
  const shortcuts = [
    { href: "/projects", label: nav("projects"), icon: shortcutIcons.folder },
    { href: "/sobre-mi", label: nav("about"), icon: shortcutIcons.text },
    { href: "/contacto", label: nav("contact"), icon: shortcutIcons.mail },
  ];
  const external = links[0];

  return (
    <>
      <BootScreen
        projectCount={projects.length}
        name={profile?.displayName ?? "Kaled"}
      />
      <Desktop className="os-home">
        <Blob shape="ring" style={{ left: 24, top: 24 }} />
        <Blob shape="circle" style={{ left: 600, top: 380 }} />
        <Blob shape="pill" style={{ right: -80, top: 720 }} />

        <Window
          id="hola"
          title={t("heroTitle")}
          file="hola.txt"
          stack="izquierda"
          labelledBy="hero-title"
          defaultPosition={{ x: 64, y: 48 }}
          width={660}
        >
          <div className="os-hello">
            <div className="os-hello-head">
              <span className="os-hello-kicker">{t("kicker")}</span>
              <ProfileAvatar
                interactive
                alt={t("avatarAlt", { name: profile?.displayName ?? "Kaled" })}
                size={128}
                className="os-hello-avatar"
              />
            </div>
            <h1
              id="hero-title"
              className="os-display"
              style={
                {
                  "--os-hero-size": `${heroSize}px`,
                  "--os-hero-chars": longestWord,
                } as React.CSSProperties
              }
            >
              {firstName}
              {restName.length > 0 && (
                <>
                  <br />
                  <span>{restName.join(" ")}</span>
                </>
              )}
            </h1>
            {profile ? (
              <p>{profile.presentation}</p>
            ) : (
              <p>{t("fallbackIntro")}</p>
            )}
            <div className="os-actions">
              <OsLinkButton href="/projects">{t("openProjects")}</OsLinkButton>
              <OsLinkButton href="/contacto" variant="outline">
                {t("writeMe")}
              </OsLinkButton>
            </div>
          </div>
        </Window>

        {recent.length > 0 && (
          <Window
            id="recientes"
            title={t("recentTitle")}
            file="proyectos_recientes/"
            stack="derecha"
            defaultPosition={{ x: 790, y: 36 }}
            width={560}
            delay={0.15}
          >
            <ul className="os-recent">
              {recent.map(({ project, preview }) => (
                <li key={project.id}>
                  <Link
                    className="os-recent-row"
                    href={`/projects/${project.slug}`}
                  >
                    <span className="os-recent-thumb">
                      <Image
                        src={mediaUrl(preview!.id)}
                        alt=""
                        fill
                        unoptimized
                        sizes="150px"
                        className="object-cover object-top"
                      />
                    </span>
                    <span>
                      <span className="os-display os-recent-name">
                        {project.title}
                      </span>
                      {project.projectType && (
                        <span className="os-recent-meta">
                          {project.projectType}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link className="os-link os-recent-more" href="/projects">
                  {t("seeAll", { count: projects.length })}
                </Link>
              </li>
            </ul>
          </Window>
        )}

        <Window
          id="sistema"
          title={t("contactTitle")}
          file="sistema.info"
          stack="derecha"
          variant="orange"
          defaultPosition={{ x: 820, y: 560 }}
          width={420}
          delay={0.3}
        >
          <dl className="os-facts">
            {facts.map(([label, value]) => (
              <div key={label} className="contents">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Window>

        <StickyNote
          id="nota-contacto"
          title={t("noteTitle")}
          tilt={-4}
          stack="izquierda"
          delay={0.45}
          defaultPosition={{ x: 96, y: 860 }}
        >
          <p>{t("noteText")}</p>
          <Link href="/contacto">{t("noteLink")}</Link>
        </StickyNote>

        <DesktopItem
          id="accesos"
          label={t("shortcuts")}
          as="nav"
          stack="izquierda"
          defaultPosition={{ x: 64, y: 760 }}
          width={660}
        >
          <ul className="os-shortcuts">
            {shortcuts.map((shortcut) => (
              <li key={shortcut.href}>
                <Link className="os-shortcut" href={shortcut.href}>
                  {shortcut.icon}
                  {shortcut.label}
                </Link>
              </li>
            ))}
            {external && (
              <li>
                <a
                  className="os-shortcut"
                  href={external.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {shortcutIcons.link}
                  {external.label} ↗
                  <span className="sr-only"> {common("newTab")}</span>
                </a>
              </li>
            )}
          </ul>
        </DesktopItem>
      </Desktop>
      <Ticker
        items={[
          ...projects.flatMap((project) => project.technologies),
          ...skills.map((skill) => skill.name),
        ]}
      />
    </>
  );
}
