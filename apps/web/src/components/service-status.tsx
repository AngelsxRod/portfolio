'use client';

import { useEffect, useState } from 'react';
import type { HealthResponse } from '@portfolio/contracts';
import { StatusPill } from '@portfolio/ui';

interface ServiceStatusProps {
  checking: string;
  offline: string;
  online: string;
}

export function ServiceStatus({ checking, offline, online }: ServiceStatusProps) {
  const [state, setState] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/health', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as HealthResponse;
        setState(response.ok && body.status === 'ok' ? 'online' : 'offline');
      })
      .catch(() => {
        if (!controller.signal.aborted) setState('offline');
      });

    return () => controller.abort();
  }, []);

  return (
    <StatusPill online={state === 'online'}>
      {state === 'checking' ? checking : state === 'online' ? online : offline}
    </StatusPill>
  );
}
