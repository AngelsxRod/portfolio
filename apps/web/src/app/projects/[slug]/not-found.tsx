import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { PublicFooter, PublicHeader } from "@/components/public-site";

export default function ProjectNotFound() {
  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="projects" />
      <main id="contenido" className="page-frame archive-main">
        <div className="empty-panel">
          <h1>Proyecto no disponible</h1>
          <p>No existe un proyecto publicado con esta dirección.</p>
          <Button
            className="mt-6"
            variant="outline"
            nativeButton={false}
            render={<Link href="/projects" />}
          >
            Ver proyectos
          </Button>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
