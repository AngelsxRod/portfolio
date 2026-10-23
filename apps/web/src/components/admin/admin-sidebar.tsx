"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/components/sidebar";
import { ExternalLinkIcon } from "lucide-react";
import { LogoutForm } from "@/app/admin/(protected)/logout-form";
import {
  adminHome,
  adminNavGroups,
  isActive,
  type AdminNavItem,
} from "./admin-nav";

function NavLink({ item, pathname }: { item: AdminNavItem; pathname: string }) {
  const { setOpenMobile } = useSidebar();
  const active = isActive(pathname, item.href);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        render={
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={() => setOpenMobile(false)}
          />
        }
      >
        <item.icon aria-hidden="true" />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link
          href="/admin"
          className="text-base font-bold tracking-tight text-sidebar-foreground"
        >
          Panel del portafolio
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Panel" className="flex flex-col gap-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavLink item={adminHome} pathname={pathname} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {adminNavGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter className="gap-2 p-4">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-sidebar-foreground underline-offset-4 hover:underline"
        >
          Ver sitio
          <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
          <span className="sr-only">(se abre en una pestaña nueva)</span>
        </Link>
        <LogoutForm />
      </SidebarFooter>
    </Sidebar>
  );
}
