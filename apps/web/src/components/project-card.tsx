import Link from 'next/link';
import type { Locale } from '@/lib/locales';
import type { Project } from '@/lib/projects';

interface ProjectCardProps {
  project: Project;
  locale: Locale;
}

export function ProjectCard({ project, locale }: ProjectCardProps) {
  return (
    <Link
      className="flex flex-col gap-3 rounded-[10px] border border-border-secondary p-8"
      href={`/${locale}/proyectos/${project.slug}`}
    >
      <div className="text-xl font-bold">{project.title}</div>
      <p className="text-sm leading-relaxed text-muted-foreground">{project.summary}</p>
      <div className="font-mono text-xs text-muted-foreground">{project.stack.join(' · ')}</div>
    </Link>
  );
}
