import { AccentBar } from '@/components/accent-bar';
import { Footer } from '@/components/footer';
import { NumberedEyebrow } from '@/components/numbered-eyebrow';
import { TimelineItem } from '@/components/timeline-item';
import type { Locale } from '@/lib/locales';
import { messages } from '@/lib/locales';

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function SobreMiPage({ params }: PageProps) {
  const { locale } = await params;
  const copy = messages[locale];

  const stackColumns = [
    {
      label: copy['sobreMi.stackFrontend'],
      color: 'purple-text' as const,
      items: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS'],
    },
    {
      label: copy['sobreMi.stackBackend'],
      color: 'purple-text' as const,
      items: ['Node.js', 'NestJS', 'REST APIs'],
    },
    {
      label: copy['sobreMi.stackData'],
      color: 'purple-text' as const,
      items: ['PostgreSQL', 'Drizzle ORM', 'Neon'],
    },
    {
      label: copy['sobreMi.stackInfra'],
      color: 'cyan-text' as const,
      items: ['Vercel', 'Turborepo', 'pnpm'],
    },
  ];

  const timeline = [
    {
      date: copy['sobreMi.timeline1Date'],
      title: copy['sobreMi.timeline1Title'],
      color: 'purple' as const,
    },
    {
      date: copy['sobreMi.timeline2Date'],
      title: copy['sobreMi.timeline2Title'],
      color: 'cyan' as const,
    },
    {
      date: copy['sobreMi.timeline3Date'],
      title: copy['sobreMi.timeline3Title'],
      color: 'purple' as const,
    },
  ];

  const education = [
    {
      label: copy['sobreMi.educationDiversificado'],
      color: 'purple-text' as const,
      title: copy['sobreMi.educationDiversificadoTitle'],
      meta: copy['sobreMi.educationDiversificadoMeta'],
    },
    {
      label: copy['sobreMi.educationUniversidad'],
      color: 'cyan-text' as const,
      title: copy['sobreMi.educationUniversidadTitle'],
      meta: copy['sobreMi.educationUniversidadMeta'],
    },
  ];

  return (
    <>
      <main className="flex flex-1 flex-col">
        <section className="flex max-w-[640px] flex-col gap-3 px-6 pt-12 sm:px-12 sm:pt-16 lg:px-24">
          <NumberedEyebrow label={copy['sobreMi.eyebrow']} number="03" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-5">
            <AccentBar />
            <h1 className="order-1 text-4xl font-bold tracking-tight sm:order-2">
              {copy['sobreMi.title']}
            </h1>
          </div>
          <p className="text-base leading-relaxed text-muted-foreground sm:ml-[26px]">
            {copy['sobreMi.subtitle']}
          </p>
        </section>

        {/* STACK */}
        <section className="flex flex-col gap-6 px-6 py-12 sm:px-12 sm:py-16 lg:px-24">
          <NumberedEyebrow label={copy['sobreMi.stackLabel']} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-4">
            {stackColumns.map((column) => (
              <div className="flex flex-col gap-4" key={column.label}>
                <div className="font-mono text-xs tracking-[0.1em] font-bold uppercase">
                  {column.label}
                </div>
                <div className="flex flex-col gap-2.5">
                  {column.items.map((item) => (
                    <div className="flex items-center gap-2.5 text-[15px]" key={item}>
                      <span
                        className={
                          column.color === 'purple-text'
                            ? 'font-mono font-bold text-purple-text'
                            : 'font-mono font-bold text-cyan-text'
                        }
                      >
                        ›
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TRAYECTORIA */}
        <section className="flex flex-col gap-10 bg-muted px-6 py-12 sm:px-12 sm:py-16 lg:px-24">
          <NumberedEyebrow label={copy['sobreMi.trajectoryLabel']} />
          <ol className="flex max-w-[760px] flex-col gap-10 border-l border-border-secondary pl-7 sm:gap-12 sm:pl-9">
            {timeline.map((entry) => (
              <TimelineItem
                color={entry.color}
                date={entry.date}
                description={copy['sobreMi.timelineDescription']}
                key={entry.date}
                title={entry.title}
              />
            ))}
          </ol>
        </section>

        {/* EDUCACION */}
        <section className="flex flex-col gap-6 px-6 py-12 sm:px-12 sm:py-16 lg:px-24">
          <NumberedEyebrow label={copy['sobreMi.educationLabel']} />
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
            {education.map((entry) => (
              <div className="flex flex-col gap-2" key={entry.label}>
                <div
                  className={
                    entry.color === 'purple-text'
                      ? 'font-mono text-[11px] tracking-[0.1em] text-purple-text uppercase'
                      : 'font-mono text-[11px] tracking-[0.1em] text-cyan-text uppercase'
                  }
                >
                  {entry.label}
                </div>
                <div className="text-[17px] font-bold">{entry.title}</div>
                <div className="font-mono text-xs text-muted-foreground">{entry.meta}</div>
              </div>
            ))}
            <div className="flex flex-col gap-3">
              <div className="font-mono text-[11px] tracking-[0.1em] text-purple-text uppercase">
                {copy['sobreMi.educationCertifications']}
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <div className="text-[15px] font-semibold">
                    {copy['sobreMi.certification1Name']}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {copy['sobreMi.certification1Meta']}
                  </div>
                </div>
                <div>
                  <div className="text-[15px] font-semibold">
                    {copy['sobreMi.certification2Name']}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {copy['sobreMi.certification2Meta']}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer variant="muted" />
    </>
  );
}
