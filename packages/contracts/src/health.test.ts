import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './health';

describe('healthResponseSchema', () => {
  it('accepts a valid health response', () => {
    expect(
      healthResponseSchema.parse({
        status: 'ok',
        database: 'ok',
        timestamp: '2026-09-13T00:00:00.000Z',
      }),
    ).toEqual({
      status: 'ok',
      database: 'ok',
      timestamp: '2026-09-13T00:00:00.000Z',
    });
  });

  it('rejects an unknown database state', () => {
    expect(() =>
      healthResponseSchema.parse({ status: 'ok', database: 'unknown', timestamp: 'invalid' }),
    ).toThrow();
  });
});
