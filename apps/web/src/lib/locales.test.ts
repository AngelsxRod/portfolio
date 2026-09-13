import { describe, expect, it } from 'vitest';
import { isLocale } from './locales';

describe('isLocale', () => {
  it('accepts supported locales', () => {
    expect(isLocale('es')).toBe(true);
    expect(isLocale('en')).toBe(true);
  });

  it('rejects unsupported locales', () => {
    expect(isLocale('fr')).toBe(false);
  });
});
