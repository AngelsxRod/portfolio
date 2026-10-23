"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { Separator } from "@repo/ui/components/separator";
import { SidebarTrigger } from "@repo/ui/components/sidebar";
import { adminHome, segmentLabels } from "./admin-nav";
import { ThemeToggle } from "@/components/theme-toggle";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function crumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean).slice(1);
  const items = [{ href: "/admin", label: adminHome.label }];
  let href = "/admin";
  for (const part of parts) {
    href += `/${part}`;
    if (uuid.test(part)) continue;
    items.push({ href, label: segmentLabels[part] ?? part });
  }
  return items;
}

export function AdminHeader() {
  const pathname = usePathname();
  const items = crumbs(pathname);
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-5" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap overflow-hidden">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <Fragment key={item.href}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem className="min-w-0">
                  {last ? (
                    <BreadcrumbPage className="truncate">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={item.href} />}>
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <ThemeToggle />
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href="/" target="_blank" rel="noopener noreferrer" />}
      >
        Ver sitio
        <ExternalLinkIcon aria-hidden="true" />
        <span className="sr-only">(se abre en una pestaña nueva)</span>
      </Button>
    </header>
  );
}
