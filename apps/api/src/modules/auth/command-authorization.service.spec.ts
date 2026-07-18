import { describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { CommandAuthorizationService } from './command-authorization.service';
import type { AuthUser } from './jwt.strategy';

describe('US158 — workspace and command authorization', () => {
  const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
  const access = new WorkspaceAccessService(workspaces);
  const authz = new CommandAuthorizationService(access);

  const owner = workspaces.create({ name: 'Primary', ownerUserId: 'user-owner' });
  const other = workspaces.create({ name: 'Other', ownerUserId: 'user-other' });

  function user(role: Role, userId = 'user-owner'): AuthUser {
    return {
      userId,
      email: `${userId}@example.com`,
      displayName: userId,
      role,
    };
  }

  it('allows Trader and Admin only inside their workspace', () => {
    const trader = authz.authorizeTradingCommand({
      user: user(Role.Trader),
      workspaceId: String(owner.id),
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
    });
    expect(trader).toEqual({
      actorId: 'user-owner',
      workspaceId: String(owner.id),
      role: Role.Trader,
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
    });

    expect(
      authz.authorizeTradingCommand({
        user: user(Role.Admin),
        workspaceId: String(owner.id),
      }).role,
    ).toBe(Role.Admin);
  });

  it('denies Reader/Researcher and cross-workspace access without leaking data', () => {
    expect(() =>
      authz.authorizeTradingCommand({
        user: user(Role.Researcher),
        workspaceId: String(owner.id),
      }),
    ).toThrow(/Trader or Administrator/);

    expect(() =>
      authz.authorizeTradingCommand({
        user: user(Role.Trader),
        workspaceId: String(other.id),
      }),
    ).toThrow(/workspace access denied/);

    expect(access.resolveAccessibleWorkspaceId(String(other.id), 'user-owner')).toBeNull();
    expect(access.resolveAccessibleWorkspaceId('missing-workspace', 'user-owner')).toBeNull();
  });
});
