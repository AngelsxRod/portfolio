import { cn } from '@/lib/utils';

interface AccentBarProps {
  className?: string;
}

export function AccentBar({ className }: AccentBarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'order-2 h-1.5 w-14 shrink-0 self-start rounded-[3px] bg-primary sm:order-1 sm:h-auto sm:w-1.5 sm:self-stretch',
        className,
      )}
    />
  );
}
