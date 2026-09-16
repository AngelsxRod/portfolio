'use client';

import { ArrowUpRight, Languages, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/locales';
import { messages } from '@/lib/locales';

interface NavProps {
  locale: Locale;
}

export function Nav({ locale }: NavProps) {
  const pathname = usePathname();
  const copy = messages[locale];
  const alternateLocale = locale === 'es' ? 'en' : 'es';
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: `/${locale}`, label: copy['nav.inicio'] },
    { href: `/${locale}/proyectos`, label: copy['nav.proyectos'] },
    { href: `/${locale}/sobre-mi`, label: copy['nav.sobreMi'] },
  ];

  const contactoHref = `/${locale}/contacto`;
  const isContactoActive = pathname === contactoHref;

  return (
    <nav className="relative border-b border-border">
      <div className="grid h-[88px] grid-cols-[1fr_auto_1fr] items-center px-6 sm:px-12 lg:px-24">
        <Link className="col-start-1 justify-self-start" href={`/${locale}`}>
          <Logo />
        </Link>
        <div className="col-start-2 hidden items-center justify-self-center gap-10 lg:flex">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                className={cn(
                  'text-sm text-muted-foreground',
                  isActive && 'font-medium text-foreground',
                )}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="col-start-3 flex items-center justify-self-end gap-2 sm:gap-3">
          <Button
            className={cn('hidden lg:inline-flex', !isContactoActive && 'border-border-secondary')}
            nativeButton={false}
            render={<Link href={contactoHref} />}
            variant={isContactoActive ? 'default' : 'outline'}
          >
            {copy['nav.contacto']}
          </Button>
          <Button
            className="hidden lg:inline-flex"
            nativeButton={false}
            render={<Link href={`/${alternateLocale}`} />}
            size="sm"
            variant="ghost"
          >
            {copy.switchLanguage}
          </Button>
          <div className="hidden lg:block">
            <ThemeToggle toDark={copy.themeToDark} toLight={copy.themeToLight} />
          </div>
          <Sheet onOpenChange={setMenuOpen} open={menuOpen}>
            <SheetTrigger
              render={
                <Button
                  aria-label={copy['nav.openMenu']}
                  className="lg:hidden"
                  size="icon"
                  variant="outline"
                />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent
              className="!w-[88vw] max-w-sm gap-0 border-border bg-background p-0"
              closeLabel={copy['nav.closeMenu']}
              side="right"
            >
              <SheetHeader className="border-b border-border px-6 py-7">
                <SheetTitle className="flex items-center justify-between pr-10">
                  <Logo />
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                    Menu
                  </span>
                </SheetTitle>
                <SheetDescription className="sr-only">{copy['nav.openMenu']}</SheetDescription>
              </SheetHeader>

              <div className="flex flex-1 flex-col px-6 py-8">
                <div className="flex flex-col">
                  {links.map((link, index) => {
                    const isActive =
                      link.href === `/${locale}`
                        ? pathname === link.href
                        : pathname.startsWith(link.href);

                    return (
                      <Link
                        className={cn(
                          'group flex items-center gap-4 border-b border-border py-5 text-xl font-medium transition-colors',
                          isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                        href={link.href}
                        key={link.href}
                        onClick={() => setMenuOpen(false)}
                      >
                        <span
                          className={cn(
                            'font-mono text-[11px] text-muted-foreground',
                            isActive && 'text-purple-text',
                          )}
                        >
                          0{index + 1}
                        </span>
                        <span className="flex-1">{link.label}</span>
                        <span
                          className={cn(
                            'size-1.5 rounded-full bg-transparent transition-colors',
                            isActive && 'bg-primary',
                          )}
                        />
                      </Link>
                    );
                  })}
                </div>

                <Button
                  className="mt-8 h-11 w-full justify-between px-4"
                  nativeButton={false}
                  render={<Link href={contactoHref} onClick={() => setMenuOpen(false)} />}
                >
                  {copy['nav.contacto']}
                  <ArrowUpRight className="size-4" />
                </Button>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-5">
                  <Button
                    className="gap-2"
                    nativeButton={false}
                    render={
                      <Link href={`/${alternateLocale}`} onClick={() => setMenuOpen(false)} />
                    }
                    variant="ghost"
                  >
                    <Languages className="size-4" />
                    {copy.switchLanguage}
                  </Button>
                  <ThemeToggle toDark={copy.themeToDark} toLight={copy.themeToLight} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
