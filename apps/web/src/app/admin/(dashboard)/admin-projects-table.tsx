'use client';

import { useMemo, useState } from 'react';
import { FilterPills } from '@/components/filter-pills';
import { StatusBadge } from '@/components/status-badge';
import type { Project } from '@/lib/projects';

type StatusFilter = 'todos' | 'publicado' | 'borrador';

const categoryLabels: Record<Project['category'], string> = {
  freelance: 'Freelance',
  personal: 'Personal',
  universidad: 'Universidad',
};

const updatedAt = ['Hoy', 'Hace 3 días', 'Hace 2 semanas'];

interface AdminProjectsTableProps {
  projects: Project[];
}

export function AdminProjectsTable({ projects }: AdminProjectsTableProps) {
  const [filter, setFilter] = useState<StatusFilter>('todos');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesFilter = filter === 'todos' || project.status === filter;
      const matchesSearch = project.title.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, projects, search]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <FilterPills
          active={filter}
          onChange={(value) => setFilter(value as StatusFilter)}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'publicado', label: 'Publicados' },
            { value: 'borrador', label: 'Borradores' },
          ]}
        />
        <input
          className="w-full rounded-lg border border-border-secondary bg-transparent px-3.5 py-2 font-mono text-xs outline-none placeholder:text-muted-foreground focus:border-primary sm:w-[260px]"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar proyecto…"
          type="text"
          value={search}
        />
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-border">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[2.2fr_1fr_1fr_1fr_0.8fr] bg-muted px-6 py-3.5 font-mono text-[11px] tracking-[0.05em] text-muted-foreground uppercase">
            <div>Proyecto</div>
            <div>Categoría</div>
            <div>Estado</div>
            <div>Actualizado</div>
            <div />
          </div>
          {filtered.map((project, index) => (
            <div
              className="grid grid-cols-[2.2fr_1fr_1fr_1fr_0.8fr] items-center border-t border-border px-6 py-[18px] text-sm"
              key={project.slug}
            >
              <div className="font-semibold">{project.title}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {categoryLabels[project.category]}
              </div>
              <div>
                <StatusBadge status={project.status} />
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                {updatedAt[index % updatedAt.length]}
              </div>
              <div className="flex gap-3.5 font-mono text-xs text-muted-foreground">
                <button type="button">Editar</button>
                <button type="button">Eliminar</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No hay proyectos que coincidan.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
