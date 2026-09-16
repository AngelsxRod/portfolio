'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FilterPills } from '@/components/filter-pills';
import { PhantomNumber } from '@/components/phantom-number';
import { StatusBadge } from '@/components/status-badge';
import type { Locale, Messages } from '@/lib/locales';
import type { Project, ProjectCategory } from '@/lib/projects';

type FilterValue = 'todos' | ProjectCategory;

interface ProyectosListProps {
  copy: Messages;
  locale: Locale;
  projects: Project[];
}

const phantomColors: Array<'purple' | 'cyan'> = ['cyan', 'purple', 'purple'];

export function ProyectosList({ copy, locale, projects }: ProyectosListProps) {
  const [filter, setFilter] = useState<FilterValue>('todos');

  const options = [
    { value: 'todos', label: copy['proyectos.filterAll'] },
    { value: 'freelance', label: copy['proyectos.filterFreelance'] },
    { value: 'personal', label: copy['proyectos.filterPersonal'] },
    { value: 'universidad', label: copy['proyectos.filterUniversidad'] },
  ];

  const categoryLabels: Record<ProjectCategory, string> = {
    freelance: copy['proyectos.categoryFreelance'],
    personal: copy['proyectos.categoryPersonal'],
    universidad: copy['proyectos.categoryUniversidad'],
  };

  const filtered = useMemo(
    () =>
      filter === 'todos' ? projects : projects.filter((project) => project.category === filter),
    [filter, projects],
  );

  return (
    <div className="flex flex-col gap-14">
      <FilterPills
        active={filter}
        onChange={(value) => setFilter(value as FilterValue)}
        options={options}
      />
      <div className="flex flex-col">
        {filtered.length === 0 ? (
          <p className="py-10 text-sm text-muted-foreground">{copy['proyectos.empty']}</p>
        ) : (
          filtered.map((project, index) => (
            <div
              className="flex flex-col gap-4 border-b border-border py-10 last:border-b-0 sm:flex-row sm:items-start sm:gap-10"
              key={project.slug}
            >
              <div className="flex gap-6 sm:gap-10">
                <PhantomNumber color={phantomColors[index % phantomColors.length]}>
                  {String(index + 1).padStart(2, '0')}
                </PhantomNumber>
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-2xl font-bold">{project.title}</div>
                    {project.featured ? (
                      <StatusBadge label={copy['proyectos.badgeFeatured']} status="destacado" />
                    ) : null}
                    <span className="rounded-full border border-border-secondary px-2.5 py-[3px] font-mono text-[11px] tracking-[0.05em] text-muted-foreground uppercase">
                      {categoryLabels[project.category]}
                    </span>
                  </div>
                  <p className="max-w-[560px] text-[15px] leading-relaxed text-muted-foreground">
                    {project.summary}
                  </p>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {project.stack.join(' · ')}
                  </div>
                </div>
              </div>
              <Link
                className="font-mono text-sm font-bold text-purple-text sm:shrink-0 sm:self-center"
                href={`/${locale}/proyectos/${project.slug}`}
              >
                <span className="text-muted-foreground">$</span>{' '}
                {project.featured ? copy['proyectos.viewRepo'] : copy['proyectos.viewProject']}
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
