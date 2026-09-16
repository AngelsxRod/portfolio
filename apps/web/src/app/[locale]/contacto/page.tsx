import { AccentBar } from '@/components/accent-bar';
import { ContactCard } from '@/components/contact-card';
import { Footer } from '@/components/footer';
import { NumberedEyebrow } from '@/components/numbered-eyebrow';
import type { Locale } from '@/lib/locales';
import { messages } from '@/lib/locales';

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function ContactoPage({ params }: PageProps) {
  const { locale } = await params;
  const copy = messages[locale];

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center gap-16 px-6 py-20 sm:px-12 lg:flex-row lg:px-24">
        <div className="flex w-full max-w-[560px] flex-col gap-6">
          <NumberedEyebrow label={copy['contacto.eyebrow']} number="04" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-5">
            <AccentBar />
            <h1 className="order-1 text-6xl leading-none font-bold tracking-tight sm:order-2">
              {copy['contacto.title']}
              <span className="text-purple-text">.</span>
            </h1>
          </div>
          <p className="max-w-[460px] text-base leading-relaxed text-muted-foreground sm:ml-[26px]">
            {copy['contacto.subtitle']}
          </p>
        </div>

        <ContactCard
          items={[
            {
              label: copy['contacto.emailLabel'],
              value: copy['contacto.emailValue'],
              href: '#',
              accent: true,
            },
            {
              label: copy['contacto.githubLabel'],
              value: 'github.com/AngelsxRod',
              href: 'https://github.com/AngelsxRod',
            },
            {
              label: copy['contacto.linkedinLabel'],
              value: copy['contacto.linkedinValue'],
              href: '#',
            },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}
