import { AccentBar } from '@/components/accent-bar';
import { Footer } from '@/components/footer';
import { NumberedEyebrow } from '@/components/numbered-eyebrow';
import type { Locale } from '@/lib/locales';
import { messages } from '@/lib/locales';
import { projects } from '@/lib/projects';
import { ProyectosList } from './proyectos-list';

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function ProyectosPage({ params }: PageProps) {
  const { locale } = await params;
  const copy = messages[locale];

  return (
    <>
      <main className="flex flex-1 flex-col gap-10 px-6 py-12 sm:gap-14 sm:px-12 sm:py-16 lg:px-24">
        <div className="flex max-w-[640px] flex-col gap-3">
          <NumberedEyebrow label={copy['proyectos.eyebrow']} number="02" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-5">
            <AccentBar />
            <h1 className="order-1 text-4xl font-bold tracking-tight sm:order-2">
              {copy['proyectos.title']}
            </h1>
          </div>
          <p className="text-base text-muted-foreground sm:ml-[26px]">
            {copy['proyectos.subtitle']}
          </p>
        </div>
        <ProyectosList copy={copy} locale={locale} projects={projects} />
      </main>
      <Footer />
    </>
  );
}
