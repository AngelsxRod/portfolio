import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "@/styles/os/home.css";
import { getPublicProfile } from "@/lib/public-profile";
import { getPublicProjects } from "@/lib/public-projects";
import { getPublicSkills } from "@/lib/public-skills";
import { mediaUrl, projectPreview } from "@/lib/os/projects";
import { safeExternalUrl } from "@/lib/safe-url";
import { BootScreen } from "@/components/os/boot-screen";
import { Blob, StickyNote } from "@/components/os/decor";
import { Desktop } from "@/components/os/desktop";
import { OsLinkButton } from "@/components/os/os-button";
import { Ticker } from "@/components/os/ticker";
import { Window } from "@/components/os/window";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inicio | angel.os" };

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
    facts.push(["usuario", profile.displayName]);
    if (profile.headline) facts.push(["rol", profile.headline]);
    if (profile.location) facts.push(["ubicación", profile.location]);
  }
  facts.push([
    "proyectos",
    <span key="count" className="os-fact-strong">
      {projects.length} en línea
    </span>,
  ]);
  if (profile?.email)
    facts.push([
      "correo",
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
        <span className="sr-only"> (se abre en otra pestaña)</span>
      </a>,
    ]);
  const shortcuts = [
    { href: "/projects", label: "proyectos/", icon: shortcutIcons.folder },
    { href: "/sobre-mi", label: "sobre-mi.txt", icon: shortcutIcons.text },
    { href: "/contacto", label: "contacto.eml", icon: shortcutIcons.mail },
  ];
  const external = links[0];

  return (
    <>
      <BootScreen projectCount={projects.length} />
      <Desktop className="os-home">
        <Blob shape="ring" style={{ left: 24, top: 24 }} />
        <Blob shape="circle" style={{ left: 600, top: 380 }} />
        <Blob shape="pill" style={{ right: -80, top: 720 }} />

        <Window
          id="hola"
          title="hola.txt"
          labelledBy="hero-title"
          defaultPosition={{ x: 64, y: 48 }}
          width={660}
        >
          <div className="os-hello">
            <span className="os-hello-kicker">// hola, soy</span>
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
              <p>Proyectos publicados y una forma directa de escribirme.</p>
            )}
            <div className="os-actions">
              <OsLinkButton href="/projects">Abrir proyectos →</OsLinkButton>
              <OsLinkButton href="/contacto" variant="outline">
                Escribirme
              </OsLinkButton>
            </div>
          </div>
        </Window>

        {recent.length > 0 && (
          <Window
            id="recientes"
            title="proyectos_recientes/"
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
                  ver los {projects.length} proyectos →
                </Link>
              </li>
            </ul>
          </Window>
        )}

        <Window
          id="sistema"
          title="sistema.info"
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
          title="¿Tienes un proyecto?"
          tilt={-4}
          style={
            { left: 96, top: 600, "--os-delay": "0.45s" } as React.CSSProperties
          }
        >
          <p>Cuéntame qué necesita tu negocio.</p>
          <Link href="/contacto">Escribirme →</Link>
        </StickyNote>

        <nav
          className="os-float"
          aria-label="Accesos directos"
          style={{ left: 420, top: 700 }}
        >
          <ul
            className="os-shortcuts"
            style={{ "--os-delay": "0.5s" } as React.CSSProperties}
          >
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
                  {external.label.toLowerCase()} ↗
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
              </li>
            )}
          </ul>
        </nav>
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
