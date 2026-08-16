import { describe, expect, it } from 'vitest';
import { Role, isKnownRole } from './role';

describe('Role (V3-S02-a)', () => {
  it('knows only the four Identity roles', () => {
    expect(Object.values(Role).sort()).toEqual(['Admin', 'Reader', 'Researcher', 'Trader']);
    expect(isKnownRole(Role.Researcher)).toBe(true);
    expect(isKnownRole('Admin')).toBe(true);
    expect(isKnownRole('Superuser')).toBe(false);
    expect(isKnownRole('Administrator')).toBe(false);
    expect(isKnownRole(undefined)).toBe(false);
  });
});
