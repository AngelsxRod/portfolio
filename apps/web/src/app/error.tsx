"use client";

import { Button } from "@repo/ui/components/button";
import { PublicFooter, PublicHeader } from "@/components/public-site";

export default function HomeError({ reset }: { reset: () => void }) {
  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="home" />
      <main id="contenido" className="page-frame archive-main">
        <div className="empty-panel">
          <h1>Portafolio no disponible</h1>
          <p>
            No se pudo cargar el contenido. Comprueba la conexión e inténtalo de
            nuevo.
          </p>
          <Button className="mt-6" onClick={reset}>
            Intentar de nuevo
          </Button>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
