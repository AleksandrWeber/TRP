import { describe, expect, it } from 'vitest';
import { AuthorizationDecisionService } from '../auth/authorization-decision.service';
import { Role } from '../identity/role';
import { VaultIsolationError } from './vault-errors';
import { VaultAccessControl } from './vault-access-control';

function accessWithMembers(members: ReadonlySet<string>): VaultAccessControl {
  const workspaceAccess = {
    isMember: (workspaceId: string, userId: string) => members.has(`${workspaceId}:${userId}`),
  };
  return new VaultAccessControl(workspaceAccess as never, new AuthorizationDecisionService());
}

describe('Vault access control (V3-S03-d)', () => {
  it('allows Trader and Admin only in a workspace they own', () => {
    const access = accessWithMembers(new Set(['ws-a:user-a']));

    expect(() =>
      access.assertCanAccess({ userId: 'user-a', role: Role.Trader }, 'ws-a'),
    ).not.toThrow();
    expect(() =>
      access.assertCanAccess({ userId: 'user-a', role: Role.Admin }, 'ws-a'),
    ).not.toThrow();
  });

  it('denies Reader and Researcher even when they own the workspace', () => {
    const access = accessWithMembers(new Set(['ws-a:user-a']));

    for (const role of [Role.Reader, Role.Researcher]) {
      expect(() => access.assertCanAccess({ userId: 'user-a', role }, 'ws-a')).toThrow(
        VaultIsolationError,
      );
    }
  });

  it('denies a foreign or unknown workspace without disclosing which condition failed', () => {
    const access = accessWithMembers(new Set(['ws-a:user-a']));

    expect(() => access.assertCanAccess({ userId: 'user-b', role: Role.Trader }, 'ws-a')).toThrow(
      VaultIsolationError,
    );
    expect(() => access.assertCanAccess({ userId: 'user-a', role: Role.Trader }, 'ws-b')).toThrow(
      VaultIsolationError,
    );
    expect(() => access.assertCanAccess({ userId: 'user-a', role: undefined }, 'ws-a')).toThrow(
      VaultIsolationError,
    );
  });
});
