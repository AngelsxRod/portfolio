import { cn } from '@/lib/utils';

interface StatItemProps {
  value: string;
  label: string;
  color: 'purple' | 'cyan';
}

export function StatItem({ value, label, color }: StatItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'font-mono text-4xl font-bold',
          color === 'purple' ? 'text-primary' : 'text-cyan',
        )}
      >
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
