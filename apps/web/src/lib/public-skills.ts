import "server-only";
import { apiUrl } from "@/lib/admin-session";
import type { PublicSkill } from "@/lib/skills";

export async function getPublicSkills() {
  const response = await fetch(`${apiUrl()}/skills`, { cache: "no-store" });
  if (!response.ok)
    throw new Error("No se pudieron recuperar las habilidades.");
  return response.json() as Promise<PublicSkill[]>;
}
