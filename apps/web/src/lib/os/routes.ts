export type OsRouteIcon =
  "home" | "projects" | "about" | "experience" | "education" | "contact";

/** `labelKey` es la clave de `nav.*` en los mensajes de cada idioma. */
export type OsRoute = {
  href: string;
  labelKey: OsRouteIcon;
  icon: OsRouteIcon;
};

/** Destinos del dock, en el orden en que aparecen. */
export const osRoutes: OsRoute[] = [
  { href: "/", labelKey: "home", icon: "home" },
  { href: "/projects", labelKey: "projects", icon: "projects" },
  { href: "/sobre-mi", labelKey: "about", icon: "about" },
  { href: "/experiencia", labelKey: "experience", icon: "experience" },
  { href: "/educacion", labelKey: "education", icon: "education" },
  { href: "/contacto", labelKey: "contact", icon: "contact" },
];

/** Ruta del dock que corresponde a una URL (`/projects/x` activa Proyectos). */
export function activeRoute(pathname: string) {
  return osRoutes.find((route) =>
    route.href === "/"
      ? pathname === "/"
      : pathname === route.href || pathname.startsWith(`${route.href}/`),
  );
}
