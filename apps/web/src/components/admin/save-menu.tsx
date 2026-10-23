"use client";

import { ChevronDownIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Spinner } from "@repo/ui/components/spinner";

/** Botón «Guardar» que despliega las opciones de guardar como borrador o publicar. */
export function SaveMenu({
  saving,
  onPublish,
  onDraft,
}: {
  saving: boolean;
  onPublish: () => void;
  onDraft: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button type="button" disabled={saving} />}>
        {saving ? (
          <>
            <Spinner role="presentation" aria-hidden="true" />
            Guardando…
          </>
        ) : (
          <>
            Guardar
            <ChevronDownIcon aria-hidden="true" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onClick={onPublish}>Publicar</DropdownMenuItem>
        <DropdownMenuItem onClick={onDraft}>Guardar borrador</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
