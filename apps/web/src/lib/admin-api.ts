import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { apiUrl, SESSION_COOKIE, webOrigin } from "@/lib/admin-session";
import type { DraftProject } from "@/lib/drafts";
import type { AdminCertificate } from "@/lib/certificates";
import type { AdminProfile } from "@/lib/profile";
import type { AdminEducation } from "@/lib/education";
import type { AdminExperience } from "@/lib/experience";
import type { AdminSkill, SkillCategory } from "@/lib/skills";

export function adminProjectsApi(path: string, init: RequestInit = {}) {
  return adminResource("projects", path, init);
}

async function adminResource(
  resource:
    | "projects"
    | "skills"
    | "skill-categories"
    | "experience"
    | "education"
    | "certificates"
    | "profile",
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

export function adminExperienceApi(path: string, init: RequestInit = {}) {
  return adminResource("experience", path, init);
}

async function readExperience<T>(path: string): Promise<T> {
  const response = await adminExperienceApi(path);
  if (response.status === 401) redirect("/admin/login");
  if (response.status === 404 || response.status === 400) notFound();
  if (!response.ok) throw new Error("No se pudo recuperar la experiencia.");
  return response.json() as Promise<T>;
}

export function getAdminExperiences() {
  return readExperience<AdminExperience[]>("");
}
export function getAdminExperience(id: string) {
  return readExperience<AdminExperience>(`/${encodeURIComponent(id)}`);
}

export function adminEducationApi(path: string, init: RequestInit = {}) {
  return adminResource("education", path, init);
}

async function readEducation<T>(path: string): Promise<T> {
  const response = await adminEducationApi(path);
  if (response.status === 401) redirect("/admin/login");
  if (response.status === 404 || response.status === 400) notFound();
  if (!response.ok) throw new Error("No se pudo recuperar la educación.");
  return response.json() as Promise<T>;
}

export function getAdminEducationList() {
  return readEducation<AdminEducation[]>("");
}
export function getAdminEducation(id: string) {
  return readEducation<AdminEducation>(`/${encodeURIComponent(id)}`);
}

export function adminCertificatesApi(path: string, init: RequestInit = {}) {
  return adminResource("certificates", path, init);
}

async function readCertificates<T>(path: string): Promise<T> {
  const response = await adminCertificatesApi(path);
  if (response.status === 401) redirect("/admin/login");
  if (response.status === 404 || response.status === 400) notFound();
  if (!response.ok) throw new Error("No se pudo recuperar los certificados.");
  return response.json() as Promise<T>;
}

export function getAdminCertificates() {
  return readCertificates<AdminCertificate[]>("");
}
export function getAdminCertificate(id: string) {
  return readCertificates<AdminCertificate>(`/${encodeURIComponent(id)}`);
}

export function adminProfileApi(path: string, init: RequestInit = {}) {
  return adminResource("profile", path, init);
}

export async function getAdminProfile() {
  const response = await adminProfileApi("");
  if (response.status === 401) redirect("/admin/login");
  if (!response.ok) throw new Error("No se pudo recuperar el perfil.");
  return response.json() as Promise<AdminProfile>;
}

/** Tecnologías ya usadas en proyectos, de más a menos frecuentes, para sugerirlas. */
export async function getTechnologySuggestions() {
  try {
    const [drafts, published] = await Promise.all([
      getDrafts(),
      getPublishedProjects(),
    ]);
    const counts = new Map<string, number>();
    for (const project of [...drafts, ...published])
      for (const tag of project.technologies)
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
      .map(([tag]) => tag)
      .slice(0, 30);
  } catch {
    return [];
  }
}
