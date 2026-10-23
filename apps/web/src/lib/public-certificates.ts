import "server-only";
import { apiUrl } from "@/lib/admin-session";
import type { PublicCertificate } from "@/lib/certificates";

export async function getPublicCertificates() {
  const response = await fetch(`${apiUrl()}/certificates`, {
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error("No se pudieron recuperar los certificados.");
  return response.json() as Promise<PublicCertificate[]>;
}
