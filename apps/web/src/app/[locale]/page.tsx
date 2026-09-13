import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ServiceStatus } from '@/components/service-status';
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
    <main>
      <nav aria-label="Language">
        <Link href={`/${alternateLocale}`}>{copy.switchLanguage}</Link>
      </nav>
      <section>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="description">{copy.description}</p>
        <ServiceStatus checking={copy.checking} offline={copy.apiOffline} online={copy.apiOnline} />
      </section>
    </main>
  );
}
