import { cn } from '@/lib/utils';

interface TimelineItemProps {
  date: string;
  title: string;
  description: string;
  color: 'purple' | 'cyan';
}

export function TimelineItem({ date, title, description, color }: TimelineItemProps) {
  return (
    <li className="relative flex flex-col gap-2 sm:flex-row sm:gap-8">
      <span
        className={cn(
          'absolute top-[5px] -left-[41px] size-2.5 rounded-full',
          color === 'purple' ? 'bg-primary' : 'bg-cyan',
        )}
      />
      <div className="shrink-0 pt-0.5 font-mono text-[13px] text-muted-foreground sm:w-[150px]">
        {date}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="text-[17px] font-bold">{title}</div>
        <p className="max-w-[480px] text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </li>
  );
}
