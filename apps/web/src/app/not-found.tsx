import type { Metadata } from "next";
import { ErrorWindow } from "@/components/os/error-window";
import { OsShell } from "@/components/os/os-shell";

export const metadata: Metadata = { title: "Página no encontrada | angel.os" };

export default function NotFound() {
  return (
    <OsShell>
      <ErrorWindow
        file="404.log"
        code="404: ruta no encontrada"
        title="Esta página no existe"
        mood="confused"
      >
        La dirección no corresponde a ninguna página del sitio. Revisa el enlace
        o vuelve al inicio.
      </ErrorWindow>
    </OsShell>
  );
}
