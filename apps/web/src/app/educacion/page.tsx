import { redirect } from "next/navigation";

/** Educación y certificados viven ahora como pestañas de la trayectoria. */
export default function EducationPage() {
  redirect("/experiencia?seccion=educacion");
}
