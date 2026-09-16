'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
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
        <div className="col-start-2 hidden items-center justify-self-center gap-10 md:flex">
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
            className={cn(!isContactoActive && 'border-border-secondary')}
            nativeButton={false}
            render={<Link href={contactoHref} />}
            variant={isContactoActive ? 'default' : 'outline'}
          >
            {copy['nav.contacto']}
          </Button>
          <Button
            className="hidden sm:inline-flex"
            nativeButton={false}
            render={<Link href={`/${alternateLocale}`} />}
            size="sm"
            variant="ghost"
          >
            {copy.switchLanguage}
          </Button>
          <ThemeToggle toDark={copy.themeToDark} toLight={copy.themeToLight} />
          <Button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? copy['nav.closeMenu'] : copy['nav.openMenu']}
            className="md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            size="icon"
            variant="ghost"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {menuOpen ? (
        <div className="flex flex-col border-t border-border bg-background px-6 py-4 md:hidden">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                className={cn(
                  'py-2.5 text-sm text-muted-foreground',
                  isActive && 'font-medium text-foreground',
                )}
                href={link.href}
                key={link.href}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            className="py-2.5 text-sm text-muted-foreground sm:hidden"
            href={`/${alternateLocale}`}
            onClick={() => setMenuOpen(false)}
          >
            {copy.switchLanguage}
          </Link>
        </div>
      ) : null}
    </nav>
  );
}
