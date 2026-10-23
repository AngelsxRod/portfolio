import { redirect } from "next/navigation";
import { SidebarProvider } from "@repo/ui/components/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { hasAdminSession } from "@/lib/admin-session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await hasAdminSession())) redirect("/admin/login");

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <SidebarProvider>
        <AdminSidebar />
        <div className="flex min-h-svh min-w-0 flex-1 flex-col bg-muted/30">
          <AdminHeader />
          <main
            id="contenido"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-6 lg:py-8"
          >
            {children}
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}
