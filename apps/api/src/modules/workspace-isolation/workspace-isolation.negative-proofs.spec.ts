import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuthSessionStore } from '../auth/auth-session.store';
import { InMemoryAuthSessionRepository } from '../auth/in-memory-auth-session.repository';
import { AuthorizationDecisionService } from '../auth/authorization-decision.service';
import { Role } from '../identity/role';
import { SecurityAuditTimelineController } from '../security-audit/security-audit-timeline.controller';
import { SecurityAuditIncidentService } from '../security-audit/security-audit-incident.service';
import type {
  SecurityAuditIncident,
  SecurityAuditIncidentEvent,
  SecurityAuditIncidentLifecycleEntry,
  SecurityAuditIncidentRecord,
} from '../security-audit/security-audit-incident';
import type { SecurityAuditIncidentRepository } from '../security-audit/security-audit-incident.repository';
import type { SecurityAuditRecord } from '../security-audit/security-audit-record';
import { VaultAccessControl } from '../secret-vault/vault-access-control';
import { VaultIsolationError } from '../secret-vault/vault-errors';
import { createDualWorkspaceIsolationFixture } from './dual-workspace.fixture';
import { IsolationMatrixRowId } from './isolation-matrix-contract';
import { expectForeignWorkspaceDenied } from './negative-proof';

class InMemoryIncidentRepository implements SecurityAuditIncidentRepository {
  constructor(private readonly records: readonly SecurityAuditRecord[]) {}

  async createIncident(_incident: SecurityAuditIncident): Promise<void> {}
  async appendEventLink(_link: SecurityAuditIncidentEvent): Promise<void> {}
  async appendLifecycle(_entry: SecurityAuditIncidentLifecycleEntry): Promise<void> {}
  async readIncident(_id: string): Promise<SecurityAuditIncidentRecord | undefined> {
    return undefined;
  }
  async readIncidentEvents(_id: string): Promise<readonly SecurityAuditRecord[]> {
    return [];
  }
  async readLifecycle(_id: string): Promise<readonly SecurityAuditIncidentLifecycleEntry[]> {
    return [];
  }
  async readIncidentIdsForEventIds(
    _eventIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly string[]>> {
    return new Map();
  }
  async readRecordsByIds(ids: readonly string[]): Promise<readonly SecurityAuditRecord[]> {
    return this.records.filter((record) => ids.includes(record.id));
  }
}

function securityAuditRecord(id: string, workspaceId: string): SecurityAuditRecord {
  return {
    id,
    eventType: 'auth.login',
    eventClass: 'authentication',
    criticality: 'critical',
    schemaVersion: 1,
    attribution: { workspaceId, actorId: `operator-${workspaceId}` },
    outcome: 'success',
    occurredAt: '2026-08-17T12:00:00.000Z',
    recordedAt: '2026-08-17T12:00:01.000Z',
    source: 's06-a-test',
    eventFingerprint: 'fingerprint',
    payload: {},
    integrityVersion: 1,
    integrityHash: 'a'.repeat(64),
  };
}

describe('Workspace isolation negative proofs (V3-S06-a)', () => {
  it(`[${IsolationMatrixRowId.WorkspaceMembershipBoundary}] static + runtime: workspace-id substitution denied`, async () => {
    const fixture = await createDualWorkspaceIsolationFixture();

    expect(fixture.access.isMember(fixture.workspaceA.id, fixture.operatorAId)).toBe(true);
    expect(fixture.access.isMember(fixture.workspaceB.id, fixture.operatorAId)).toBe(false);
    expectForeignWorkspaceDenied(
      fixture.access.resolveAccessibleWorkspaceId(fixture.workspaceB.id, fixture.operatorAId),
      fixture.workspaceB.id,
    );
    expect(() => fixture.access.assertMember(fixture.workspaceB.id, fixture.operatorAId)).toThrow(
      'workspace access denied',
    );
  });

  it(`[${IsolationMatrixRowId.VaultSecrets}] runtime + regression: Reader and foreign Trader cannot access Vault B`, async () => {
    const fixture = await createDualWorkspaceIsolationFixture();
    const vault = new VaultAccessControl(fixture.access, new AuthorizationDecisionService());

    expect(() =>
      vault.assertCanAccess(
        { userId: fixture.operatorAId, role: Role.Reader },
        fixture.workspaceA.id,
      ),
    ).toThrow(VaultIsolationError);
    expect(() =>
      vault.assertCanAccess(
        { userId: fixture.operatorAId, role: Role.Trader },
        fixture.workspaceB.id,
      ),
    ).toThrow(VaultIsolationError);
  });

  it(`[${IsolationMatrixRowId.Session}] runtime + regression: foreign session cannot bind to operator A`, async () => {
    const fixture = await createDualWorkspaceIsolationFixture();
    const sessions = new AuthSessionStore(new InMemoryAuthSessionRepository());
    const sessionB = await sessions.issue(fixture.operatorBId);

    await expect(sessions.requireActive(sessionB.sessionId, fixture.operatorAId)).rejects.toThrow();
    await expect(
      sessions.findOwnActive(fixture.operatorAId, sessionB.sessionId),
    ).resolves.toBeNull();
  });

  it(`[${IsolationMatrixRowId.Timeline}] runtime + regression: Trader A denied before Timeline B read`, async () => {
    const fixture = await createDualWorkspaceIsolationFixture();
    const readWorkspaceTimeline = vi.fn();
    const controller = new SecurityAuditTimelineController(
      { readWorkspaceTimeline } as never,
      fixture.access,
    );

    await expect(
      controller.read(
        {
          user: {
            userId: fixture.operatorAId,
            email: 'operator-a@example.com',
            displayName: 'Operator A',
            role: Role.Trader,
          },
        },
        fixture.workspaceB.id,
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(readWorkspaceTimeline).not.toHaveBeenCalled();
  });

  it(`[${IsolationMatrixRowId.IncidentInvestigation}] runtime + regression: incident A cannot link audit evidence B`, async () => {
    const fixture = await createDualWorkspaceIsolationFixture();
    const service = new SecurityAuditIncidentService(
      new InMemoryIncidentRepository([securityAuditRecord('audit-b', fixture.workspaceB.id)]),
    );

    await expect(
      service.open({ workspaceId: fixture.workspaceA.id, eventIds: ['audit-b'] }),
    ).rejects.toThrow('incident workspace');
  });
});
