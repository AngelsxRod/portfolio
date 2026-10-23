import "server-only";
import { apiUrl } from "@/lib/admin-session";
import type { PublicExperience } from "@/lib/experience";
import { allPages, type Page, pageQuery } from "@/lib/pagination";

export async function getPublicExperience() {
  return allPages(async (page, pageSize) => {
    const response = await fetch(
      `${apiUrl()}/experience${pageQuery(page, pageSize)}`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error("No se pudo recuperar la experiencia.");
    return response.json() as Promise<Page<PublicExperience>>;
  });
}
