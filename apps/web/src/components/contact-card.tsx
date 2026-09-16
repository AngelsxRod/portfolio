import { cn } from '@/lib/utils';

interface ContactItem {
  label: string;
  value: string;
  href: string;
  accent?: boolean;
}

interface ContactCardProps {
  items: ContactItem[];
}

/**
 * Siempre oscura, en ambos temas (igual que TerminalWindow) — los colores
 * internos van hardcodeados, no usan tokens que cambian con el tema.
 */
export function ContactCard({ items }: ContactCardProps) {
  return (
    <div className="w-full max-w-[440px] shrink-0 overflow-hidden rounded-[10px] border border-[oklch(0.26_0.03_300)] bg-surface-deep">
      {items.map((item, index) => (
        <a
          className={cn(
            'flex flex-col gap-1 px-7 py-6',
            index < items.length - 1 && 'border-b border-[oklch(0.26_0.03_300)]',
          )}
          href={item.href}
          key={item.label}
        >
          <span className="font-mono text-[11px] tracking-[0.1em] text-[oklch(0.68_0.02_300)] uppercase">
            {item.label}
          </span>
          <span
            className={cn(
              'text-[17px] font-semibold',
              item.accent ? 'text-[oklch(0.75_0.15_225)]' : 'text-[oklch(0.97_0_0)]',
            )}
          >
            {item.value}
          </span>
        </a>
      ))}
    </div>
  );
}
