import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { apiUrl, SESSION_COOKIE, webOrigin } from "@/lib/admin-session";
import type { DraftProject } from "@/lib/drafts";

export async function adminProjectsApi(path: string, init: RequestInit = {}) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return Response.json(
      { message: "Inicia sesión para continuar." },
      { status: 401 },
    );
  }
  return fetch(`${apiUrl()}/admin/projects${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      Cookie: `${SESSION_COOKIE}=${token}`,
      Origin: webOrigin(),
    },
    cache: "no-store",
  });
}

export function adminApi(path: string, init: RequestInit = {}) {
  return adminProjectsApi(`/drafts${path}`, init);
}

async function readDrafts<T>(path: string): Promise<T> {
  const response = await adminApi(path);
  if (response.status === 401) redirect("/admin/login");
  if (response.status === 404 || response.status === 400) notFound();
  if (!response.ok) throw new Error("No se pudieron recuperar los borradores.");
  return response.json() as Promise<T>;
}

export function getDrafts() {
  return readDrafts<DraftProject[]>("");
}
export function getDraft(id: string) {
  return readDrafts<DraftProject>(`/${encodeURIComponent(id)}`);
}

export async function getPublishedProjects() {
  const response = await adminProjectsApi("/published");
  if (response.status === 401) redirect("/admin/login");
  if (!response.ok)
    throw new Error("No se pudieron recuperar los proyectos publicados.");
  return response.json() as Promise<import("@/lib/drafts").PublishedProject[]>;
}
