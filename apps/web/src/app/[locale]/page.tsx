import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ServiceStatus } from '@/components/service-status';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isLocale, locales, messages } from '@/lib/locales';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const copy = messages[locale];
  const alternateLocale = locale === 'es' ? 'en' : 'es';

  return (
    <main className="grid min-h-svh grid-rows-[auto_1fr] p-6 sm:p-12 lg:p-16">
      <nav aria-label="Preferencias" className="flex items-center justify-end gap-2">
        <Button render={<Link href={`/${alternateLocale}`} />} variant="ghost">
          {copy.switchLanguage}
        </Button>
        <ThemeToggle toDark={copy.themeToDark} toLight={copy.themeToLight} />
      </nav>
      <section className="w-full max-w-3xl place-self-center">
        <Badge className="tracking-widest uppercase" variant="outline">
          {copy.eyebrow}
        </Badge>
        <h1 className="mt-4 max-w-[12ch] text-6xl leading-[0.9] font-semibold tracking-tight sm:text-7xl lg:text-8xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          {copy.description}
        </p>
        <div className="mt-8">
          <ServiceStatus
            checking={copy.checking}
            offline={copy.apiOffline}
            online={copy.apiOnline}
          />
        </div>
      </section>
    </main>
  );
}
