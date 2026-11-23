import { notFound } from "next/navigation";

// Rutas desconocidas bajo un idioma: muestran el 404 traducido del sitio.
export default function CatchAll() {
  notFound();
}
