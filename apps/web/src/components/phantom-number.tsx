import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PhantomNumberProps {
  children: ReactNode;
  color?: 'purple' | 'cyan';
}

export function PhantomNumber({ children, color = 'purple' }: PhantomNumberProps) {
  return (
    <div
      className={cn(
        'phantom-number w-16 shrink-0 font-mono text-4xl leading-none font-bold sm:w-24 sm:text-[56px]',
        color === 'purple' ? 'text-purple-ghost' : 'text-cyan-ghost',
      )}
    >
      {children}
    </div>
  );
}
