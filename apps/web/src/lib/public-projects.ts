import "server-only";
import { notFound } from "next/navigation";
import { apiUrl } from "@/lib/admin-session";
import type { PublishedProject } from "@/lib/drafts";
import { allPages, type Page, pageQuery } from "@/lib/pagination";

async function publicApi(path: string) {
  return fetch(`${apiUrl()}/projects${path}`, { cache: "no-store" });
}

export async function getPublicProjects() {
  return allPages(async (page, pageSize) => {
    const response = await publicApi(pageQuery(page, pageSize));
    if (!response.ok)
      throw new Error("No se pudieron recuperar los proyectos.");
    return response.json() as Promise<Page<PublishedProject>>;
  });
}

/** La recomendación es accesoria: si falla, el detalle se muestra sin ella. */
export async function getRelatedProjects(slug: string) {
  try {
    const response = await publicApi(`/${encodeURIComponent(slug)}/related`);
    if (!response.ok) return [];
    return (await response.json()) as PublishedProject[];
  } catch {
    return [];
  }
}

export async function getPublicProject(slug: string) {
  const response = await publicApi(`/${encodeURIComponent(slug)}`);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("No se pudo recuperar el proyecto.");
  return response.json() as Promise<PublishedProject>;
}
