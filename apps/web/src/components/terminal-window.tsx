import type { ReactNode } from 'react';

interface TerminalWindowProps {
  title: string;
  children: ReactNode;
}

/**
 * La superficie profunda es idéntica en ambos temas por diseño, así que el
 * borde y los grises del chrome van hardcodeados (no usan --border/--foreground,
 * que sí cambian con el tema) para que la ventana nunca se vea "clareada".
 */
export function TerminalWindow({ title, children }: TerminalWindowProps) {
  return (
    <div className="w-full max-w-[440px] shrink-0 overflow-hidden rounded-[10px] border border-[oklch(0.26_0.03_300)] bg-surface-deep">
      <div className="flex items-center gap-2 border-b border-[oklch(0.26_0.03_300)] bg-surface-deep-header px-4 py-3">
        <span className="size-2.5 rounded-full bg-[oklch(0.3_0.03_300)]" />
        <span className="size-2.5 rounded-full bg-[oklch(0.38_0.03_300)]" />
        <span className="size-2.5 rounded-full bg-[oklch(0.46_0.03_300)]" />
        <span className="ml-2 font-mono text-xs text-[oklch(0.5_0.03_300)]">{title}</span>
      </div>
      <div className="p-6 font-mono text-sm leading-[1.85] text-[oklch(0.82_0.02_300)]">
        {children}
      </div>
    </div>
  );
}
