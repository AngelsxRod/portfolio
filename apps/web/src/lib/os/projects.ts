import type { PublishedProject } from "@/lib/drafts";
import { safeExternalUrl } from "@/lib/safe-url";

export const ALL_FILTER = "todos";
const MIN_FILTER_SIZE = 2;

export type ProjectFilter = { value: string; label: string; count: number };

/**
 * Filtros del explorador: «Todos» más cada tipo de proyecto que agrupe al
 * menos dos proyectos publicados, en orden de aparición. Un filtro de un solo
 * elemento no ayuda a nadie; sin tipos repetidos, solo queda «Todos».
 */
export function projectFilters(
  projects: Pick<PublishedProject, "projectType">[],
  allLabel = "Todos",
): ProjectFilter[] {
  const counts = new Map<string, number>();
  for (const project of projects) {
    const type = project.projectType?.trim();
    if (type) counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return [
    { value: ALL_FILTER, label: allLabel, count: projects.length },
    ...[...counts]
      .filter(([, count]) => count >= MIN_FILTER_SIZE)
      .map(([type, count]) => ({ value: type, label: type, count })),
  ];
}

export function matchesFilter(
  project: Pick<PublishedProject, "projectType">,
  filter: string,
) {
  return filter === ALL_FILTER || project.projectType?.trim() === filter;
}

/** Imagen de vista previa: la destacada o la primera; `null` sin imágenes. */
export function projectPreview(
  project: Pick<PublishedProject, "media" | "featuredMediaId">,
) {
  return (
    project.media.find((image) => image.id === project.featuredMediaId) ??
    project.media[0] ??
    null
  );
}

/** Host del sitio publicado (`elmaster502.com`), sin `www.`; `null` si no es seguro. */
export function projectHost(demoUrl: string | null) {
  const url = safeExternalUrl(demoUrl);
  return url ? new URL(url).host.replace(/^www\./, "") : null;
}

export const mediaUrl = (id: string) => `/api/projects/media/${id}`;

/**
 * Nombre de transición de vista compartido por la miniatura de un proyecto y
 * su captura principal en el detalle: al navegar entre ambas, la imagen se
 * desplaza de un sitio al otro en lugar de cortar.
 */
export const projectTransitionName = (slug: string) => `proyecto-${slug}`;

export type NotesSection = { heading: string | null; body: string };

const HEADING = /^ {0,3}#{1,2}\s+(.+?)\s*#*\s*$/;
const FENCE = /^ {0,3}(```|~~~)/;

/**
 * Divide la descripción Markdown en secciones por sus encabezados `#` y `##`
 * (ignorando los que están dentro de bloques de código). La primera sección
 * es la introducción: el texto previo al primer encabezado o, si no hay, la
 * primera sección con encabezado.
 */
export function splitNotesSections(markdown: string): {
  intro: NotesSection | null;
  sections: NotesSection[];
} {
  const all: NotesSection[] = [];
  let current: { heading: string | null; lines: string[] } = {
    heading: null,
    lines: [],
  };
  let fence: string | null = null;
  const flush = () => {
    const body = current.lines.join("\n").trim();
    if (current.heading !== null || body)
      all.push({ heading: current.heading, body });
  };
  for (const line of markdown.split(/\r?\n/)) {
    const marker = FENCE.exec(line)?.[1];
    if (marker) fence = fence === marker ? null : (fence ?? marker);
    const heading = fence ? null : HEADING.exec(line)?.[1];
    if (heading) {
      flush();
      current = { heading, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  flush();
  const [intro = null, ...sections] = all;
  return { intro, sections };
}
