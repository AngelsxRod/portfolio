import { Badge } from "@repo/ui/components/badge";

/** Estado de publicación con texto y forma, no solo color. */
export function StatusBadge({
  status,
  feminine = false,
}: {
  status: "draft" | "published";
  feminine?: boolean;
}) {
  if (status === "published")
    return <Badge>{feminine ? "Publicada" : "Publicado"}</Badge>;
  return <Badge variant="secondary">Borrador</Badge>;
}
