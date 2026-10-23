import "server-only";
import { apiUrl } from "@/lib/admin-session";
import type { PublicEducation } from "@/lib/education";

export async function getPublicEducation() {
  const response = await fetch(`${apiUrl()}/education`, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo recuperar la educación.");
  return response.json() as Promise<PublicEducation[]>;
}
