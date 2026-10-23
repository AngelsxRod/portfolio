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
import type { PublicationResource } from "./publication-button";

/** Descarta los cambios pendientes y deja la versión publicada como estaba. */
export function DiscardPendingButton({
  resource,
  id,
  name,
  onDiscarded,
}: {
  resource: PublicationResource;
  id: string;
  name: string;
  /** Restablece el formulario a la versión publicada. */
  onDiscarded?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function discard() {
    setPending(true);
    try {
      const response = await fetch(`/api/admin/${resource}/${id}/publication`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discard" }),
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
      if (!response.ok) {
        const result = await response.json();
        toast.error(result.message ?? "No se pudieron descartar los cambios.");
        return;
      }
      toast.success("Cambios descartados");
      onDiscarded?.();
      router.refresh();
    } catch {
      toast.error("No se pudo conectar. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            aria-label={`Descartar cambios de ${name}`}
          />
        }
      >
        Descartar cambios
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Descartar los cambios de «{name}»?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Se perderán los cambios guardados como borrador. El sitio sigue
            mostrando la versión publicada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setOpen(false);
              void discard();
            }}
          >
            Descartar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
