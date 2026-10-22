import type { Metadata } from "next";
import { ComponentGallery } from "./component-gallery";

export const metadata: Metadata = {
  title: "Galería de componentes | Portfolio",
  description: "Explora los componentes compartidos de la interfaz.",
};

export default function ComponentsPage() {
  return <ComponentGallery />;
}
