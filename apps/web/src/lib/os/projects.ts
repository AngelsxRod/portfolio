import type { PublishedProject } from "@/lib/drafts";
import { safeExternalUrl } from "@/lib/safe-url";

export const ALL_FILTER = "todos";

export type ProjectFilter = { value: string; label: string; count: number };

/**
 * Filtros del explorador: «Todos» más cada tipo de proyecto que exista en los
 * datos publicados, en orden de aparición. Sin tipos, solo «Todos».
 */
export function projectFilters(
  projects: Pick<PublishedProject, "projectType">[],
): ProjectFilter[] {
  const counts = new Map<string, number>();
  for (const project of projects) {
    const type = project.projectType?.trim();
    if (type) counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return [
    { value: ALL_FILTER, label: "Todos", count: projects.length },
    ...[...counts].map(([type, count]) => ({
      value: type,
      label: type,
      count,
    })),
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
