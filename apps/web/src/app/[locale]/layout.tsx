import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Nav } from '@/components/nav';
import { isLocale, locales } from '@/lib/locales';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="flex min-h-svh flex-col">
      <Nav locale={locale} />
      {children}
    </div>
  );
}
