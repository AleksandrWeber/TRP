import { describe, expect, it } from 'vitest';
import {
  confirmRoleChangePrompt,
  isCurrentOperator,
  isPeopleRole,
  roleLabel,
} from './peopleProduct';

describe('peopleProduct (V3-S02-d)', () => {
  it('accepts only the four product roles', () => {
    expect(isPeopleRole('Reader')).toBe(true);
    expect(isPeopleRole('Researcher')).toBe(true);
    expect(isPeopleRole('Trader')).toBe(true);
    expect(isPeopleRole('Admin')).toBe(true);
    expect(isPeopleRole('Superuser')).toBe(false);
    expect(roleLabel('Admin')).toBe('Administrator');
  });

  it('marks the signed-in operator and explains a role change', () => {
    expect(isCurrentOperator('a', 'a')).toBe(true);
    expect(isCurrentOperator('a', 'b')).toBe(false);
    expect(confirmRoleChangePrompt('Riley', 'Trader')).toContain('Riley');
    expect(confirmRoleChangePrompt('Riley', 'Trader')).toContain('Trader');
  });
});
