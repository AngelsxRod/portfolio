import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { apiUrl, SESSION_COOKIE, webOrigin } from "@/lib/admin-session";
import type { DraftProject } from "@/lib/drafts";
import type { AdminSkill, SkillCategory } from "@/lib/skills";

export function adminProjectsApi(path: string, init: RequestInit = {}) {
  return adminResource("projects", path, init);
}

async function adminResource(
  resource: "projects" | "skills" | "skill-categories",
  path: string,
  init: RequestInit = {},
) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return Response.json(
      { message: "Inicia sesión para continuar." },
      { status: 401 },
    );
  }
  return fetch(`${apiUrl()}/admin/${resource}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(new Headers(init.headers).has("Idempotency-Key")
        ? {
            "Idempotency-Key": new Headers(init.headers).get(
              "Idempotency-Key",
            )!,
          }
        : {}),
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

export async function getAdminProject(id: string) {
  const response = await adminProjectsApi(`/${encodeURIComponent(id)}`);
  if (response.status === 401) redirect("/admin/login");
  if (response.status === 400 || response.status === 404) notFound();
  if (!response.ok) throw new Error("No se pudo recuperar el proyecto.");
  return response.json() as Promise<
    (DraftProject | import("@/lib/drafts").PublishedProject) & {
      media: import("@/lib/drafts").ProjectImage[];
    }
  >;
}

export function adminSkillsApi(path: string, init: RequestInit = {}) {
  return adminResource("skills", path, init);
}

export function adminSkillCategoriesApi(path: string, init: RequestInit = {}) {
  return adminResource("skill-categories", path, init);
}

async function readSkills<T>(path: string, api = adminSkillsApi): Promise<T> {
  const response = await api(path);
  if (response.status === 401) redirect("/admin/login");
  if (response.status === 404 || response.status === 400) notFound();
  if (!response.ok)
    throw new Error("No se pudieron recuperar las habilidades.");
  return response.json() as Promise<T>;
}

export function getAdminSkills() {
  return readSkills<AdminSkill[]>("");
}
export function getAdminSkill(id: string) {
  return readSkills<AdminSkill>(`/${encodeURIComponent(id)}`);
}

export function getSkillCategories() {
  return readSkills<SkillCategory[]>("", adminSkillCategoriesApi);
}
export function getSkillCategory(id: string) {
  return readSkills<SkillCategory>(
    `/${encodeURIComponent(id)}`,
    adminSkillCategoriesApi,
  );
}
