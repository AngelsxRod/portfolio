"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { toast } from "@repo/ui/components/sonner";
import { Spinner } from "@repo/ui/components/spinner";

export type PublicationResource =
  "projects" | "skills" | "experience" | "education" | "certificates";

/**
 * Publica un borrador o retira un publicado. Retirar pide confirmación porque
 * el contenido deja de verse en el sitio.
 */
export function PublicationButton({
  resource,
  id,
  name,
  context,
  status,
  noun,
  feminine = false,
  completeHref,
  size,
}: {
  resource: PublicationResource;
  id: string;
  name: string;
  /** Dato extra que distingue el nombre solo para lectores de pantalla. */
  context?: string;
  status: "draft" | "published";
  /** Sustantivo en mayúscula inicial para los avisos, p. ej. «Proyecto». */
  noun: string;
  feminine?: boolean;
  /** Si publicar falla por campos faltantes, ofrece ir a completar el borrador. */
  completeHref?: string;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const publishing = status === "draft";
  const label = publishing ? "Publicar" : "Retirar";

  async function submit() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/admin/${resource}/${id}/publication`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: publishing ? "publish" : "unpublish" }),
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
          ...(publishing && response.status === 400 && completeHref
            ? {
                action: {
                  label: "Completar borrador",
                  onClick: () => router.push(completeHref),
                },
              }
            : {}),
        });
        return;
      }
      toast.success(
        `${noun} ${publishing ? (feminine ? "publicada" : "publicado") : feminine ? "retirada" : "retirado"}`,
      );
      router.refresh();
    } catch {
      toast.error("No se pudo conectar. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  const content = pending ? (
    <>
      <Spinner role="presentation" aria-hidden="true" />
      {publishing ? "Publicando…" : "Retirando…"}
    </>
  ) : (
    label
  );

  if (publishing)
    return (
      <Button
        size={size}
        disabled={pending}
        onClick={submit}
        aria-label={`${label} ${name}${context ? ` · ${context}` : ""}`}
      >
        {content}
      </Button>
    );

  return (
    <AlertDialog open={confirming} onOpenChange={setConfirming}>
      <AlertDialogTrigger
        render={
          <Button
            variant="outline"
            size={size}
            disabled={pending}
            aria-label={`${label} ${name}${context ? ` · ${context}` : ""}`}
          />
        }
      >
        {content}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Retirar «{name}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Dejará de mostrarse en el sitio y volverá a ser un borrador que
            puedes editar y publicar de nuevo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setConfirming(false);
              void submit();
            }}
          >
            Retirar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
