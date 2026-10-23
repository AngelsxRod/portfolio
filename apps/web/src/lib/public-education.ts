import "server-only";
import { apiUrl } from "@/lib/admin-session";
import type { PublicEducation } from "@/lib/education";
import { allPages, type Page, pageQuery } from "@/lib/pagination";

export async function getPublicEducation() {
  return allPages(async (page, pageSize) => {
    const response = await fetch(
      `${apiUrl()}/education${pageQuery(page, pageSize)}`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error("No se pudo recuperar la educación.");
    return response.json() as Promise<Page<PublicEducation>>;
  });
}
