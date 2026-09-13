import type { ReactNode } from 'react';

export interface StatusPillProps {
  children: ReactNode;
  online?: boolean;
}

export function StatusPill({ children, online = false }: StatusPillProps) {
  return (
    <span className="status-pill" data-online={online}>
      <span aria-hidden="true" className="status-dot" />
      {children}
    </span>
  );
}
