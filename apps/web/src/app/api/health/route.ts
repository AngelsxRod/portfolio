import type { HealthResponse } from '@portfolio/contracts';

const apiUrl = (process.env.API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export async function GET() {
  try {
    const response = await fetch(`${apiUrl}/api/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2_000),
    });

    return new Response(await response.text(), {
      headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
      status: response.status,
    });
  } catch {
    const unavailable: HealthResponse = {
      status: 'error',
      database: 'error',
      timestamp: new Date().toISOString(),
    };

    return Response.json(unavailable, { status: 503 });
  }
}
