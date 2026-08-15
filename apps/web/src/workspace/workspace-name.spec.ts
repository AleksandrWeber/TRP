import { describe, expect, it } from 'vitest';
import { validateWorkspaceName } from './workspace-name';

describe('validateWorkspaceName (PC-14)', () => {
  it('rejects empty names', () => {
    expect(validateWorkspaceName('')).toBe('Enter a workspace name.');
    expect(validateWorkspaceName('   ')).toBe('Enter a workspace name.');
  });

  it('rejects names longer than 80 characters', () => {
    expect(validateWorkspaceName('x'.repeat(81))).toBe(
      'Workspace name must be 80 characters or fewer.',
    );
  });

  it('accepts a usable name', () => {
    expect(validateWorkspaceName(' Research Lab ')).toBeNull();
  });
});
