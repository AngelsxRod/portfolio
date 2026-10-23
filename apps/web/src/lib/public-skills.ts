import "server-only";
import { apiUrl } from "@/lib/admin-session";
import type { PublicSkill } from "@/lib/skills";
import { allPages, type Page, pageQuery } from "@/lib/pagination";

export async function getPublicSkills() {
  return allPages(async (page, pageSize) => {
    const response = await fetch(
      `${apiUrl()}/skills${pageQuery(page, pageSize)}`,
      { cache: "no-store" },
    );
    if (!response.ok)
      throw new Error("No se pudieron recuperar las habilidades.");
    return response.json() as Promise<Page<PublicSkill>>;
  });
}
