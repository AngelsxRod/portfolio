import Link from 'next/link';
import { AccentBar } from '@/components/accent-bar';
import { Footer } from '@/components/footer';
import { NumberedEyebrow } from '@/components/numbered-eyebrow';
import { ProjectCard } from '@/components/project-card';
import { ServiceStatus } from '@/components/service-status';
import { StatItem } from '@/components/stat-item';
import { TerminalWindow } from '@/components/terminal-window';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/lib/locales';
import { messages } from '@/lib/locales';
import { projects } from '@/lib/projects';

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const copy = messages[locale];
  const featuredProjects = projects.slice(0, 2);

  return (
    <>
      <main className="flex flex-1 flex-col">
        {/* HERO */}
        <section className="reveal-up flex flex-col items-center gap-12 px-6 py-12 sm:px-12 sm:py-16 lg:flex-row lg:justify-center lg:gap-16 lg:px-24 lg:py-32">
          <div className="flex w-full max-w-[600px] flex-col gap-6">
            <NumberedEyebrow label={copy['home.eyebrow']} number="01" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-5">
              <AccentBar />
              <h1 className="order-1 text-5xl leading-[0.98] font-bold tracking-tight sm:order-2 sm:text-6xl">
                <span className="block font-normal text-muted-foreground">Angel</span>
                <span className="block">Rodriguez</span>
              </h1>
            </div>
            <p className="max-w-[460px] text-base leading-relaxed text-muted-foreground sm:text-lg">
              {copy['home.heroDescription']}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 sm:gap-4">
              <Button nativeButton={false} render={<Link href={`/${locale}/proyectos`} />}>
                {copy['home.ctaProjects']}
              </Button>
              <Button
                className="border-border-secondary"
                nativeButton={false}
                render={<Link href={`/${locale}/sobre-mi`} />}
                variant="outline"
              >
                {copy['home.ctaAbout']}
              </Button>
            </div>
            <div className="font-mono text-[13px] text-muted-foreground">
              <span className="text-purple-text">$</span> {copy['home.availability']}
            </div>
            <div>
              <ServiceStatus
                checking={copy['home.checking']}
                offline={copy['home.apiOffline']}
                online={copy['home.apiOnline']}
              />
            </div>
          </div>

          <TerminalWindow title="whoami.ts">
            <div className="text-[oklch(0.45_0.03_300)]">$ whoami</div>
            <div>&nbsp;</div>
            <div>
              <span className="text-[oklch(0.75_0.15_225)]">const</span> angel = {'{'}
            </div>
            <div>
              &nbsp;&nbsp;role:{' '}
              <span className="text-[oklch(0.75_0.15_225)]">&quot;Fullstack Developer&quot;</span>,
            </div>
            <div>
              &nbsp;&nbsp;stack: [
              <span className="text-[oklch(0.75_0.15_225)]">&quot;Next.js&quot;</span>,{' '}
              <span className="text-[oklch(0.75_0.15_225)]">&quot;NestJS&quot;</span>,{' '}
              <span className="text-[oklch(0.75_0.15_225)]">&quot;PostgreSQL&quot;</span>],
            </div>
            <div>
              &nbsp;&nbsp;status:{' '}
              <span className="text-[oklch(0.75_0.15_225)]">&quot;available&quot;</span>,
            </div>
            <div>
              {'};'}
              <span className="ml-1 inline-block h-[15px] w-2 translate-y-0.5 bg-[oklch(0.75_0.15_225)]" />
            </div>
          </TerminalWindow>
        </section>

        {/* PROYECTOS DESTACADOS */}
        <section className="reveal-up reveal-delay-1 flex flex-col gap-8 bg-muted/90 px-6 py-16 backdrop-blur-sm sm:gap-10 sm:px-12 sm:py-24 lg:px-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3">
              <NumberedEyebrow label={copy['home.featuredLabel']} />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-5">
                <AccentBar />
                <h2 className="order-1 text-[32px] font-bold tracking-tight sm:order-2">
                  {copy['home.featuredTitle']}
                </h2>
              </div>
            </div>
            <Link
              className="font-mono text-[13px] font-bold text-purple-text"
              href={`/${locale}/proyectos`}
            >
              {copy['home.viewAll']}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.slug} locale={locale} project={project} />
            ))}
          </div>
        </section>

        {/* ESTADISTICAS */}
        <section className="reveal-up reveal-delay-2 grid grid-cols-2 gap-3 px-6 py-14 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-8 sm:px-12 sm:py-20 lg:px-24">
          <StatItem color="purple" label={copy['home.statsProjects']} value="[X]+" />
          <StatItem color="cyan" label={copy['home.statsYears']} value="[X]" />
          <StatItem color="purple" label={copy['home.statsTech']} value="[X]+" />
          <StatItem color="cyan" label={copy['home.statsRemote']} value="100%" />
        </section>

        {/* CTA FINAL */}
        <section className="flex flex-col items-center gap-6 bg-muted px-6 py-20 text-center sm:px-12 sm:py-28 lg:px-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {copy['home.ctaFinalTitlePrefix']}
            <span className="text-primary">?</span>
          </h2>
          <p className="max-w-[480px] text-base leading-relaxed text-muted-foreground">
            {copy['home.ctaFinalBody']}
          </p>
          <Button
            className="mt-2 bg-cyan text-cyan-foreground hover:bg-cyan/80"
            nativeButton={false}
            render={<Link href={`/${locale}/contacto`} />}
          >
            {copy['home.ctaFinalButton']}
          </Button>
        </section>
      </main>
      <Footer />
    </>
  );
}
