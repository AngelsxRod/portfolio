import "server-only";
import { apiUrl } from "@/lib/admin-session";
import type { PublicExperience } from "@/lib/experience";

export async function getPublicExperience() {
  const response = await fetch(`${apiUrl()}/experience`, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo recuperar la experiencia.");
  return response.json() as Promise<PublicExperience[]>;
}
