import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AccentBar } from '@/components/accent-bar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/lib/locales';
import { messages } from '@/lib/locales';
import { projects } from '@/lib/projects';

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function ProyectoDetallePage({ params }: PageProps) {
  const { locale, slug } = await params;
  const copy = messages[locale];

  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) notFound();

  const project = projects[index]!;
  const prev = index > 0 ? projects[index - 1] : null;
  const next = index < projects.length - 1 ? projects[index + 1] : null;

  const categoryLabels: Record<string, string> = {
    freelance: copy['proyectos.categoryFreelance'],
    personal: copy['proyectos.categoryPersonal'],
    universidad: copy['proyectos.categoryUniversidad'],
  };

  return (
    <>
      <main className="flex flex-1 flex-col gap-10 px-6 py-14 sm:px-12 lg:px-24">
        <Link
          className="w-fit font-mono text-[13px] text-muted-foreground"
          href={`/${locale}/proyectos`}
        >
          {copy['detalle.back']}
        </Link>

        <div className="flex max-w-[860px] flex-col gap-3">
          <div className="flex items-baseline gap-2.5 font-mono">
            <span className="text-sm font-bold text-purple-text">
              {copy['detalle.eyebrowLabel']}
            </span>
            <span className="text-[13px] tracking-[0.12em] text-muted-foreground uppercase">
              {String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-5">
            <AccentBar />
            <h1 className="order-1 text-[48px] font-bold tracking-tight sm:order-2">
              {project.title}
            </h1>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground sm:ml-[26px]">
            {project.summary}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-8 font-mono text-xs text-muted-foreground">
            <div>
              <span className="tracking-[0.05em] uppercase">{copy['detalle.roleLabel']}</span>
              <br />
              <span className="text-sm text-foreground">{project.role}</span>
            </div>
            <div>
              <span className="tracking-[0.05em] uppercase">{copy['detalle.yearLabel']}</span>
              <br />
              <span className="text-sm text-foreground">{project.year}</span>
            </div>
            <div>
              <span className="tracking-[0.05em] uppercase">{copy['detalle.categoryLabel']}</span>
              <br />
              <span className="text-sm text-foreground">{categoryLabels[project.category]}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <Button nativeButton={false} render={<Link href={project.siteUrl ?? '#'} />}>
              {copy['detalle.viewSite']}
            </Button>
            <Button
              className="border-border-secondary"
              nativeButton={false}
              render={<Link href={project.repoUrl ?? '#'} />}
              variant="outline"
            >
              <span className="text-muted-foreground">$</span> {copy['detalle.viewRepo']}
            </Button>
          </div>
        </div>

        <div className="flex h-[480px] w-full items-center justify-center rounded-xl border border-dashed border-border-secondary bg-muted">
          <span className="font-mono text-[13px] text-muted-foreground">
            {copy['detalle.heroPlaceholder']}
          </span>
        </div>

        <div className="flex flex-col gap-16 lg:flex-row">
          <div className="flex flex-1 flex-col gap-8">
            <div className="flex flex-col gap-2">
              <div className="font-mono text-xs tracking-[0.1em] text-cyan-text uppercase">
                {copy['detalle.problem']}
              </div>
              <p className="text-[15px] leading-loose text-muted-foreground">{project.problem}</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-mono text-xs tracking-[0.1em] text-cyan-text uppercase">
                {copy['detalle.solution']}
              </div>
              <p className="text-[15px] leading-loose text-muted-foreground">{project.solution}</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-mono text-xs tracking-[0.1em] text-cyan-text uppercase">
                {copy['detalle.result']}
              </div>
              <p className="text-[15px] leading-loose text-muted-foreground">{project.result}</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-8 lg:w-[280px] lg:shrink-0">
            <div className="flex flex-col gap-3">
              <div className="font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
                {copy['detalle.stack']}
              </div>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((tech, index) => (
                  <span
                    className="rounded-full border border-border-secondary px-3 py-1.5 font-mono text-xs"
                    key={`${tech}-${index}`}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
                {copy['detalle.links']}
              </div>
              <Link className="text-sm text-purple-text" href={project.siteUrl ?? '#'}>
                <span className="text-muted-foreground">$</span> {copy['detalle.liveSite']}
              </Link>
              <Link className="text-sm text-purple-text" href={project.repoUrl ?? '#'}>
                <span className="text-muted-foreground">$</span> {copy['detalle.sourceCode']}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-8">
          {prev ? (
            <Link className="flex flex-col gap-1" href={`/${locale}/proyectos/${prev.slug}`}>
              <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                {copy['detalle.prev']}
              </span>
              <span className="text-base font-semibold">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              className="flex flex-col items-end gap-1"
              href={`/${locale}/proyectos/${next.slug}`}
            >
              <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                {copy['detalle.next']}
              </span>
              <span className="text-base font-semibold">{next.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
