import { toast } from "@repo/ui/components/sonner";
import type { PublicationResource } from "./publication-button";

/**
 * Publica un registro recién creado como borrador. Si falla (p. ej. faltan
 * campos para publicar) el borrador se conserva y se avisa del motivo.
 */
export async function publishCreated(
  resource: PublicationResource,
  id: string,
  noun: string,
  feminine: boolean,
) {
  try {
    const response = await fetch(`/api/admin/${resource}/${id}/publication`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish" }),
    });
    const result = await response.json();
    if (!response.ok) {
      const fields = result.fields
        ? Object.values(result.fields).join(" ")
        : "";
      toast.error(
        `Se guardó el borrador, pero no se pudo publicar${result.message ? `: ${result.message}` : "."}`,
        { description: fields || undefined },
      );
      return false;
    }
    toast.success(`${noun} ${feminine ? "publicada" : "publicado"}`);
    return true;
  } catch {
    toast.error("Se guardó el borrador, pero no se pudo publicar.");
    return false;
  }
}
