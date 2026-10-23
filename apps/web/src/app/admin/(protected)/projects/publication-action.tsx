"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/sonner";

export function PublicationAction({
  id,
  title,
  status,
}: {
  id: string;
  title: string;
  status: "draft" | "published";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const action = status === "draft" ? "publish" : "unpublish";
  const label = status === "draft" ? "Publicar" : "Retirar";

  async function submit() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/admin/projects/${id}/publication`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (response.status === 401) {
        toast.error("Tu sesión venció.", {
          description: "Inicia sesión para continuar.",
          action: {
            label: "Iniciar sesión",
            onClick: () => router.push("/admin/login"),
          },
        });
        return;
      }
      const result = await response.json();
      if (!response.ok) {
        const fieldErrors = result.fields
          ? Object.values(result.fields).join(" ")
          : "";
        toast.error(result.message ?? "No se pudo cambiar la publicación.", {
          description: fieldErrors || undefined,
          ...(status === "draft" && response.status === 400
            ? {
                action: {
                  label: "Completar borrador",
                  onClick: () => router.push(`/admin/projects/${id}/edit`),
                },
              }
            : {}),
        });
        return;
      }
      toast.success(
        status === "draft" ? "Proyecto publicado" : "Proyecto retirado",
      );
      router.refresh();
    } catch {
      toast.error("No se pudo conectar. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        variant={status === "draft" ? "default" : "outline"}
        disabled={pending}
        onClick={submit}
        aria-label={`${label} ${title}`}
      >
        {pending ? "Actualizando…" : label}
      </Button>
    </div>
  );
}
