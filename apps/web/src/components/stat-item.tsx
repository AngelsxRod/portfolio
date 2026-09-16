import { cn } from '@/lib/utils';

interface StatItemProps {
  value: string;
  label: string;
  color: 'purple' | 'cyan';
}

export function StatItem({ value, label, color }: StatItemProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-border p-4 sm:border-0 sm:p-0">
      <div
        className={cn(
          'font-mono text-3xl font-bold sm:text-4xl',
          color === 'purple' ? 'text-primary' : 'text-cyan',
        )}
      >
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
