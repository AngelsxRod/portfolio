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
        'w-24 shrink-0 font-mono text-[56px] leading-none font-bold',
        color === 'purple' ? 'text-purple-ghost' : 'text-cyan-ghost',
      )}
    >
      {children}
    </div>
  );
}
