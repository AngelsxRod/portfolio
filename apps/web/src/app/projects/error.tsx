"use client";

import { useEffect } from "react";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/sonner";
import { PublicFooter, PublicHeader } from "@/components/public-site";

export default function ProjectsError({ reset }: { reset: () => void }) {
  useEffect(() => {
    toast.error("No se pudieron cargar los proyectos.", {
      description: "Comprueba la conexión e inténtalo de nuevo.",
      id: "projects-load-error",
    });
  }, []);

  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="projects" />
      <main id="contenido" className="page-frame archive-main">
        <div className="empty-panel">
          <h1>Proyectos no disponibles</h1>
          <p>
            No se pudo cargar el archivo. Comprueba la conexión e inténtalo de
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
