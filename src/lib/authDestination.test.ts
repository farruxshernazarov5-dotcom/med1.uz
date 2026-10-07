import { describe, expect, it } from 'vitest';
import { safeAuthDestination, signInDestination } from './authDestination';

describe('auth return destination', () => {
  it('keeps appointment and cabinet queries', () => {
    expect(safeAuthDestination('/mobile-appointments?panel=upcoming')).toBe('/mobile-appointments?panel=upcoming');
    expect(signInDestination('/dashboard/patient?tab=lab')).toBe('/auth?next=%2Fdashboard%2Fpatient%3Ftab%3Dlab');
  });
  it('rejects external destinations and auth loops', () => {
    for (const value of ['//evil.example', '/\\evil.example', 'https://evil.example', '/auth?next=/auth', '/reset-password', '/\nevil.example']) {
      expect(safeAuthDestination(value)).toBeNull();
    }
  });
});