"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/sonner";

export function ExperiencePublicationAction({
  id,
  name,
  status,
}: {
  id: string;
  name: string;
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
      const response = await fetch(`/api/admin/experience/${id}/publication`, {
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
        toast.error(result.message ?? "No se pudo cambiar la publicación.");
        return;
      }
      toast.success(
        status === "draft" ? "Experiencia publicada" : "Experiencia retirada",
      );
      router.refresh();
    } catch {
      toast.error("No se pudo conectar. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant={status === "draft" ? "default" : "outline"}
      disabled={pending}
      onClick={submit}
      aria-label={`${label} ${name}`}
    >
      {pending ? "Actualizando…" : label}
    </Button>
  );
}
