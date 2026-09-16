import { cn } from '@/lib/utils';

type Status = 'destacado' | 'publicado' | 'borrador';

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

const defaultLabels: Record<Status, string> = {
  destacado: 'Destacado',
  publicado: 'Publicado',
  borrador: 'Borrador',
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-[3px] font-mono text-[11px] tracking-[0.05em] uppercase',
        status === 'destacado' && 'bg-primary font-bold text-primary-foreground',
        status === 'publicado' && 'bg-cyan font-bold text-cyan-foreground',
        status === 'borrador' && 'border border-border-secondary text-muted-foreground',
      )}
    >
      {label ?? defaultLabels[status]}
    </span>
  );
}
