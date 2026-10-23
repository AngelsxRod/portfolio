import { redirect } from "next/navigation";
import Link from "next/link";
import { Separator } from "@repo/ui/components/separator";
import { hasAdminSession } from "@/lib/admin-session";
import { LogoutForm } from "./logout-form";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await hasAdminSession())) redirect("/admin/login");

  return (
    <div className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/admin" className="text-lg font-semibold">
            Panel administrativo
          </Link>
          <LogoutForm />
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <nav
          aria-label="Panel"
          className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium"
        >
          <Link href="/admin">Proyectos</Link>
          <Link href="/admin/skills">Habilidades</Link>
          <Link href="/admin/experience">Experiencia</Link>
          <Link href="/admin/education">Educación</Link>
          <Link href="/admin/certificates">Certificados</Link>
          <Link href="/admin/profile">Perfil</Link>
        </nav>
        <Separator className="mb-8" />
        {children}
      </div>
    </div>
  );
}
