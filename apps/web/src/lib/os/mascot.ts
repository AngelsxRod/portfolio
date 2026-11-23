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

const phrases: Record<string, string[]> = {
  "/projects": [
    "Aquí viven mis proyectos.",
    "Pasa el cursor por uno para ver su vista previa.",
    "Con «Abrir ficha →» ves el proyecto completo.",
  ],
  "/projects/detail": [
    "Cambia de pestaña para ver las distintas vistas.",
    "Más abajo hay otros proyectos como este.",
  ],
  "/experiencia": [
    "Despliega un trabajo para ver sus logros.",
    "La línea de tiempo resume todo el recorrido.",
  ],
  "/educacion": [
    "Estudios y certificados, todo en un lugar.",
    "Abre un estudio para ver su detalle.",
  ],
  "/contacto": [
    "¿Tienes un proyecto? Escríbeme.",
    "Responderé al correo que dejes.",
  ],
};

/**
 * La mascota solo acompaña las páginas donde el avatar grande no está ya:
 * el inicio y «Sobre mí» tienen el suyo, y las páginas de error su ventana.
 */
export function mascotVisibleOn(pathname: string) {
  const route = activeRoute(pathname);
  return !!route && route.href !== "/" && route.href !== "/sobre-mi";
}

/** Frases de la página; la ficha de un proyecto tiene las suyas. */
export function mascotPhrases(pathname: string) {
  if (pathname.startsWith("/projects/")) return phrases["/projects/detail"]!;
  const route = activeRoute(pathname);
  return (route && phrases[route.href]) || [];
}

/** Aviso sobre ventanas guardadas en «Ventanas», o `null` si no hay. */
export function hiddenWindowsPhrase(count: number) {
  if (count <= 0) return null;
  return count === 1
    ? "Tienes 1 ventana guardada en «Ventanas»."
    : `Tienes ${count} ventanas guardadas en «Ventanas».`;
}

/** Frase `index` de la lista, dando la vuelta al llegar al final. */
export function pickPhrase(list: string[], index: number) {
  return list.length === 0 ? "" : list[index % list.length]!;
}
