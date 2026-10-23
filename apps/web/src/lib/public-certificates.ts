import "server-only";
import { apiUrl } from "@/lib/admin-session";
import type { PublicCertificate } from "@/lib/certificates";
import { allPages, type Page, pageQuery } from "@/lib/pagination";

export async function getPublicCertificates() {
  return allPages(async (page, pageSize) => {
    const response = await fetch(
      `${apiUrl()}/certificates${pageQuery(page, pageSize)}`,
      { cache: "no-store" },
    );
    if (!response.ok)
      throw new Error("No se pudieron recuperar los certificados.");
    return response.json() as Promise<Page<PublicCertificate>>;
  });
}
