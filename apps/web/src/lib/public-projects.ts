import "server-only";
import { notFound } from "next/navigation";
import { apiUrl } from "@/lib/admin-session";
import type { PublishedProject } from "@/lib/drafts";

async function publicApi(path: string) {
  return fetch(`${apiUrl()}/projects${path}`, { cache: "no-store" });
}

export async function getPublicProjects() {
  const response = await publicApi("");
  if (!response.ok) throw new Error("No se pudieron recuperar los proyectos.");
  return response.json() as Promise<PublishedProject[]>;
}

export async function getPublicProject(slug: string) {
  const response = await publicApi(`/${encodeURIComponent(slug)}`);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("No se pudo recuperar el proyecto.");
  return response.json() as Promise<PublishedProject>;
}
