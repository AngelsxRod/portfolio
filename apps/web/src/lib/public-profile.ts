import "server-only";
import { apiUrl } from "@/lib/admin-session";
import type { PublicProfile } from "@/lib/profile";

/** Perfil publicado o `null` si todavía no se publicó. */
export async function getPublicProfile() {
  const response = await fetch(`${apiUrl()}/profile`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("No se pudo recuperar el perfil.");
  return response.json() as Promise<PublicProfile>;
}
