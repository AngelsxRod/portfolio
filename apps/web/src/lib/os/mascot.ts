import { activeRoute } from "./routes";

/** Clave de `localStorage` que recuerda si la persona ocultó la mascota. */
export const MASCOT_KEY = "angel-os-mascot";

type Store = Pick<Storage, "getItem" | "setItem">;

/** `true` si la mascota está activa; por defecto lo está. */
export function mascotEnabled(storage: () => Store | undefined) {
  try {
    return storage()?.getItem(MASCOT_KEY) !== "off";
  } catch {
    return true;
  }
}

/** Recuerda la preferencia; ignora navegadores sin almacenamiento. */
export function saveMascotEnabled(
  enabled: boolean,
  storage: () => Store | undefined,
) {
  try {
    storage()?.setItem(MASCOT_KEY, enabled ? "on" : "off");
  } catch {
    // Ventana privada o almacenamiento bloqueado: la preferencia no se recuerda.
  }
}

/** Claves de `mascot.*` en los mensajes, por página. */
const phrases: Record<string, string[]> = {
  "/projects": ["projects.1", "projects.2", "projects.3"],
  "/projects/detail": ["detail.1", "detail.2"],
  "/experiencia": ["experience.1", "experience.2"],
  "/educacion": ["education.1", "education.2"],
  "/contacto": ["contact.1", "contact.2"],
};

/**
 * La mascota solo acompaña las páginas donde el avatar grande no está ya:
 * el inicio y «Sobre mí» tienen el suyo, y las páginas de error su ventana.
 */
export function mascotVisibleOn(pathname: string) {
  const route = activeRoute(pathname);
  return !!route && route.href !== "/" && route.href !== "/sobre-mi";
}

/** Claves de las frases de la página; la ficha de un proyecto tiene las suyas. */
export function mascotPhrases(pathname: string) {
  if (pathname.startsWith("/projects/")) return phrases["/projects/detail"]!;
  const route = activeRoute(pathname);
  return (route && phrases[route.href]) || [];
}

/** Frase `index` de la lista, dando la vuelta al llegar al final. */
export function pickPhrase(list: string[], index: number) {
  return list.length === 0 ? "" : list[index % list.length]!;
}
