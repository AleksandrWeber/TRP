import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../identity/repositories/in-memory-user.repository';
import { Role } from '../identity/role';
import { UserDomainService } from '../identity/user-domain.service';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { decideAuthorization } from './authorization-decision';
import { CommandAuthorizationService } from './command-authorization.service';
import { PermissionClass } from './permission-catalog';
import { roleAllowsPermission } from './permission-matrix';

function readSrc(relativeFromAuth: string): string {
  return readFileSync(resolve(__dirname, relativeFromAuth), 'utf8');
}

describe('Privilege constraints (V3-S02-e)', () => {
  it('does not let Admin skip Gate or Risk (C9 / C7 / C8 unbound)', () => {
    expect(roleAllowsPermission(Role.Admin, PermissionClass.Bypass)).toBe(false);
    expect(roleAllowsPermission(Role.Admin, PermissionClass.LiveCommand)).toBe(false);
    expect(roleAllowsPermission(Role.Admin, PermissionClass.VaultConnections)).toBe(false);
    expect(decideAuthorization({ role: Role.Admin, action: PermissionClass.Bypass }).allowed).toBe(
      false,
    );
    expect(
      decideAuthorization({ role: Role.Admin, action: PermissionClass.LiveCommand }).allowed,
    ).toBe(false);

    const people = readSrc('../identity/people.controller.ts');
    expect(people).not.toMatch(/bypass|skipGate|skipRisk|override/i);

    const runtimeValidation = readSrc('../runtime-enforcement/runtime-validation.controller.ts');
    expect(runtimeValidation).toContain('No overrides');
    expect(runtimeValidation).not.toMatch(/skipGate|adminOverride|bypass/i);

    const risk = readSrc('../risk-engine/risk.controller.ts');
    expect(risk).not.toMatch(/skipRisk|adminOverride|bypass/i);
  });

  it('does not treat role assignment as workspace membership', async () => {
    const users = new UserDomainService(new InMemoryUserRepository());
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    const authz = new CommandAuthorizationService(access);

    const owner = await users.create({
      email: 'owner@example.com',
      displayName: 'Owner',
      role: Role.Admin,
    });
    const other = await users.create({
      email: 'other@example.com',
      displayName: 'Other',
    });
    const ownerSpace = await workspaces.create({
      name: 'Owner space',
      ownerUserId: owner.id,
    });
    const otherSpace = await workspaces.create({
      name: 'Other space',
      ownerUserId: other.id,
    });

    await users.assignRole(other.id, Role.Admin);

    expect(other.role).toBe(Role.Admin);
    expect(access.isMember(ownerSpace.id, other.id)).toBe(false);
    expect(access.resolveAccessibleWorkspaceId(String(ownerSpace.id), other.id)).toBeNull();
    expect(() =>
      authz.authorizeTradingCommand({
        user: {
          userId: other.id,
          email: other.email,
          displayName: other.displayName,
          role: Role.Admin,
        },
        workspaceId: String(ownerSpace.id),
      }),
    ).toThrow(/workspace access denied/);
    expect(() =>
      authz.authorizeTradingCommand({
        user: {
          userId: owner.id,
          email: owner.email,
          displayName: owner.displayName,
          role: Role.Admin,
        },
        workspaceId: String(otherSpace.id),
      }),
    ).toThrow(/workspace access denied/);
  });
});
