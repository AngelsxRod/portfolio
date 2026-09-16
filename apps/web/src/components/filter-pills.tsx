'use client';

import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterPillsProps {
  options: FilterOption[];
  active: string;
  onChange: (value: string) => void;
}

export function FilterPills({ options, active, onChange }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 font-mono text-[13px]">
      {options.map((option) => {
        const isActive = option.value === active;
        return (
          <button
            className={cn(
              'rounded-full px-[18px] py-2 transition-all duration-200 hover:-translate-y-0.5',
              isActive
                ? 'bg-primary font-bold text-primary-foreground'
                : 'border border-border-secondary bg-background/40 text-muted-foreground hover:border-primary/60 hover:text-foreground',
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
