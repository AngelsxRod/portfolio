export type OsRouteIcon =
  "home" | "projects" | "about" | "experience" | "education" | "contact";

export type OsRoute = { href: string; label: string; icon: OsRouteIcon };

/** Destinos del dock, en el orden en que aparecen. */
export const osRoutes: OsRoute[] = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/projects", label: "Proyectos", icon: "projects" },
  { href: "/sobre-mi", label: "Sobre mí", icon: "about" },
  { href: "/experiencia", label: "Trayectoria", icon: "experience" },
  { href: "/educacion", label: "Estudios", icon: "education" },
  { href: "/contacto", label: "Contacto", icon: "contact" },
];

/** Ruta del dock que corresponde a una URL (`/projects/x` activa Proyectos). */
export function activeRoute(pathname: string) {
  return osRoutes.find((route) =>
    route.href === "/"
      ? pathname === "/"
      : pathname === route.href || pathname.startsWith(`${route.href}/`),
  );
}
