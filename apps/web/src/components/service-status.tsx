'use client';

import { useEffect, useState } from 'react';
import type { HealthResponse } from '@portfolio/contracts';
import { StatusPill } from '@portfolio/ui';

const HEALTH_CHECK_ATTEMPTS = 5;
const HEALTH_CHECK_RETRY_DELAY_MS = 1_000;

interface ServiceStatusProps {
  checking: string;
  offline: string;
  online: string;
}

export function ServiceStatus({ checking, offline, online }: ServiceStatusProps) {
  const [state, setState] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const controller = new AbortController();
    let attempts = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    const checkHealth = async () => {
      attempts += 1;

      try {
        const response = await fetch('/api/health', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const body = (await response.json()) as HealthResponse;

        if (response.ok && body.status === 'ok') {
          setState('online');
          return;
        }
      } catch {
        if (controller.signal.aborted) return;
      }

      if (attempts >= HEALTH_CHECK_ATTEMPTS) {
        setState('offline');
        return;
      }

      retryTimeout = setTimeout(() => void checkHealth(), HEALTH_CHECK_RETRY_DELAY_MS);
    };

    void checkHealth();

    return () => {
      controller.abort();
      clearTimeout(retryTimeout);
    };
  }, []);

  return (
    <StatusPill online={state === 'online'}>
      {state === 'checking' ? checking : state === 'online' ? online : offline}
    </StatusPill>
  );
}
