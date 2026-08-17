import { describe, expect, it } from 'vitest';
import { normalizeSecurityAuditAttribution } from './security-audit-attribution';

describe('security-audit-attribution', () => {
  it('requires workspace-scoped privilege attribution', () => {
    expect(() =>
      normalizeSecurityAuditAttribution('authz.role-change', {
        actorId: 'admin-1',
        subjectId: 'user-2',
        resourceType: 'user-role',
      }),
    ).toThrow('workspaceId');
  });

  it('preserves honest optional attribution for sign-in events', () => {
    expect(
      normalizeSecurityAuditAttribution('auth.login', {
        workspaceId: 'workspace-a',
      }),
    ).toEqual({ workspaceId: 'workspace-a' });
  });

  it('merges correlation identifiers without inventing actors', () => {
    expect(
      normalizeSecurityAuditAttribution(
        'authz.deny',
        { workspaceId: 'workspace-a', actorId: 'admin-1' },
        'corr-1',
      ),
    ).toEqual({
      workspaceId: 'workspace-a',
      actorId: 'admin-1',
      correlationId: 'corr-1',
    });
  });
});
