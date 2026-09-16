import { cn } from '@/lib/utils';

interface FooterProps {
  variant?: 'default' | 'muted';
}

export function Footer({ variant = 'default' }: FooterProps) {
  return (
    <footer
      className={cn(
        'flex shrink-0 items-center justify-between border-t px-6 py-8 sm:px-12 lg:px-24',
        variant === 'muted' ? 'border-border-secondary bg-muted' : 'border-border',
      )}
    >
      <div className="font-mono text-xs text-muted-foreground">© 2026 Angel Rodriguez</div>
      <div className="flex gap-6">
        <a
          className="text-[13px] text-muted-foreground"
          href="https://github.com/AngelsxRod"
          rel="noreferrer"
          target="_blank"
        >
          GitHub
        </a>
        <a
          className="text-[13px] text-muted-foreground"
          href="https://linkedin.com"
          rel="noreferrer"
          target="_blank"
        >
          LinkedIn
        </a>
      </div>
    </footer>
  );
}
