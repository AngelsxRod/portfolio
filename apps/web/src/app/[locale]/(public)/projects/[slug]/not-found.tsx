import { ErrorWindow } from "@/components/os/error-window";

export default function ProjectNotFound() {
  return (
    <ErrorWindow
      file="404.log"
      code="404: proyecto no encontrado"
      title="Proyecto no disponible"
      back={{ href: "/projects", label: "← Ver proyectos" }}
    >
      No existe un proyecto publicado con esta dirección.
    </ErrorWindow>
  );
}
