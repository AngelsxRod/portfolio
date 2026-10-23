"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet";

type Item = { page: string; href: string; label: string };

/** Menú de navegación para pantallas estrechas: panel lateral con objetivos táctiles amplios. */
export function MobileNav({
  items,
  current,
}: {
  items: Item[];
  current?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="mobile-nav-trigger"
            aria-label="Abrir menú de navegación"
          />
        }
      >
        <MenuIcon aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="right" className="w-4/5 max-w-xs">
        <SheetHeader>
          <SheetTitle>Menú</SheetTitle>
          <SheetDescription className="sr-only">
            Secciones del portafolio
          </SheetDescription>
        </SheetHeader>
        <nav aria-label="Navegación principal" className="px-2 pb-6">
          <ul className="flex flex-col gap-1">
            {items.map(({ page, href, label }) => (
              <li key={page}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={current === page ? "page" : undefined}
                  className="flex min-h-12 items-center rounded-lg px-4 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-foreground"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
