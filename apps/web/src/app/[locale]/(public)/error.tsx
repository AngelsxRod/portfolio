"use client";

import { ErrorWindow } from "@/components/os/error-window";

export default function PublicError({ reset }: { reset: () => void }) {
  return (
    <ErrorWindow
      file="error.log"
      code="error: no se pudo cargar el contenido"
      title="Contenido no disponible"
      retry={reset}
    >
      El contenido no llegó desde el servidor. Comprueba la conexión e inténtalo
      de nuevo.
    </ErrorWindow>
  );
}
