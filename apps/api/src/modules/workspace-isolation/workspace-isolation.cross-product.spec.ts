import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuthorizationDecisionService } from '../auth/authorization-decision.service';
import { Role } from '../identity/role';
import type { SecurityAuditIncidentRepository } from '../security-audit/security-audit-incident.repository';
import type {
  SecurityAuditRecord,
  SecurityAuditTimelineCursor,
  SecurityAuditTimelinePage,
} from '../security-audit/security-audit-record';
import type { SecurityAuditRepository } from '../security-audit/security-audit.repository';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import { SecurityAuditTimelineController } from '../security-audit/security-audit-timeline.controller';
import { SecurityAuditTimelineService } from '../security-audit/security-audit-timeline.service';
import { HoldableSecretType } from '../secret-vault/holdable-secret-type';
import { InMemorySecretVaultRepository } from '../secret-vault/in-memory-secret-vault.repository';
import { SecretVaultService, type Clock } from '../secret-vault/secret-vault.service';
import { VaultAccessControl } from '../secret-vault/vault-access-control';
import { staticWrappingKeySource } from '../secret-vault/wrapping-key';
import { NoOpLogger } from '../../logging/noop.logger';
import { createDualWorkspaceIsolationFixture } from './dual-workspace.fixture';
import { IsolationMatrixRowId } from './isolation-matrix-contract';
import { expectNoForeignPayload } from './negative-proof';

class FixedCrossProductClock implements Clock {
  nowIso(): string {
    return '2026-08-17T12:00:00.000Z';
  }
}

class InMemoryCrossProductAuditRepository implements SecurityAuditRepository {
  readonly records: SecurityAuditRecord[] = [];

  async append(record: SecurityAuditRecord): Promise<void> {
    this.records.push(record);
  }

  async readAllForIntegrityVerification(): Promise<readonly SecurityAuditRecord[]> {
    return this.records;
  }

  async readTimeline(input: {
    workspaceId: string;
    after?: SecurityAuditTimelineCursor;
    limit: number;
  }): Promise<SecurityAuditTimelinePage> {
    const matching = this.records
      .filter((record) => record.attribution.workspaceId === input.workspaceId)
      .sort(
        (left, right) =>
          Date.parse(left.occurredAt) - Date.parse(right.occurredAt) ||
          left.id.localeCompare(right.id),
      )
      .filter(
        (record) =>
          !input.after ||
          Date.parse(record.occurredAt) > Date.parse(input.after.occurredAt) ||
          (record.occurredAt === input.after.occurredAt && record.id > input.after.id),
      );
    const records = matching.slice(0, input.limit);
    const last = records.at(-1);
    return {
      records,
      ...(matching.length > input.limit && last
        ? { nextCursor: { occurredAt: last.occurredAt, id: last.id } }
        : {}),
    };
  }
}

class EmptyIncidentRepository implements SecurityAuditIncidentRepository {
  async createIncident(): Promise<void> {}
  async appendEventLink(): Promise<void> {}
  async appendLifecycle(): Promise<void> {}
  async readRecordsByIds(): Promise<readonly SecurityAuditRecord[]> {
    return [];
  }
  async readIncident(): Promise<undefined> {
    return undefined;
  }
  async readIncidentEvents(): Promise<readonly SecurityAuditRecord[]> {
    return [];
  }
  async readLifecycle(): Promise<[]> {
    return [];
  }
  async readIncidentIdsForEventIds(): Promise<ReadonlyMap<string, readonly string[]>> {
    return new Map();
  }
}

const WRAPPING_KEY = 'trp-s06-d-cross-product-wrapping-key';

describe('Workspace isolation cross-product regressions (V3-S06-d)', () => {
  it(`[${IsolationMatrixRowId.VaultSecrets} → ${IsolationMatrixRowId.SecurityAuditStore} → ${IsolationMatrixRowId.Timeline}] proves workspace-transitive lifecycle isolation`, async () => {
    const fixture = await createDualWorkspaceIsolationFixture();
    const auditRepository = new InMemoryCrossProductAuditRepository();
    const audit = new SecurityAuditService(auditRepository);
    const vault = new SecretVaultService(
      new InMemorySecretVaultRepository(),
      new FixedCrossProductClock(),
      staticWrappingKeySource(WRAPPING_KEY),
      new VaultAccessControl(fixture.access, new AuthorizationDecisionService()),
      new NoOpLogger(),
      audit,
    );
    const timeline = new SecurityAuditTimelineService(
      auditRepository,
      new EmptyIncidentRepository(),
    );

    await vault.store({
      actorWorkspaceId: fixture.operatorAId,
      actorRole: Role.Trader,
      workspaceId: fixture.workspaceA.id,
      type: HoldableSecretType.Binance,
      fields: { apiKey: 'a-key', apiSecret: 'a-secret' },
    });
    await vault.replace({
      actorWorkspaceId: fixture.operatorAId,
      actorRole: Role.Trader,
      workspaceId: fixture.workspaceA.id,
      type: HoldableSecretType.Binance,
      fields: { apiKey: 'a-replacement-key', apiSecret: 'a-replacement-secret' },
    });
    await vault.store({
      actorWorkspaceId: fixture.operatorBId,
      actorRole: Role.Trader,
      workspaceId: fixture.workspaceB.id,
      type: HoldableSecretType.Binance,
      fields: { apiKey: 'b-key', apiSecret: 'b-secret' },
    });
    await vault.replace({
      actorWorkspaceId: fixture.operatorBId,
      actorRole: Role.Trader,
      workspaceId: fixture.workspaceB.id,
      type: HoldableSecretType.Binance,
      fields: { apiKey: 'b-replacement-key', apiSecret: 'b-replacement-secret' },
    });

    await vi.waitFor(() => expect(auditRepository.records).toHaveLength(4));
    expect(
      auditRepository.records
        .filter((record) => record.attribution.workspaceId === fixture.workspaceA.id)
        .every((record) => record.attribution.actorId === fixture.operatorAId),
    ).toBe(true);

    const workspaceATimeline = await timeline.readWorkspaceTimeline({
      workspaceId: fixture.workspaceA.id,
    });
    expect(workspaceATimeline.entries).toHaveLength(2);
    expect(workspaceATimeline.entries.every((entry) => entry.eventType === 'vault.lifecycle')).toBe(
      true,
    );
    expectNoForeignPayload(workspaceATimeline, [
      fixture.operatorBId,
      'b-key',
      'b-secret',
      'b-replacement-key',
      'b-replacement-secret',
    ]);

    const workspaceBTimeline = await timeline.readWorkspaceTimeline({
      workspaceId: fixture.workspaceB.id,
      pageSize: 1,
    });
    expect(workspaceBTimeline.nextCursor).toBeDefined();
    const workspaceAAfterBCursor = await timeline.readWorkspaceTimeline({
      workspaceId: fixture.workspaceA.id,
      cursor: workspaceBTimeline.nextCursor,
    });
    expectNoForeignPayload(workspaceAAfterBCursor, [
      fixture.operatorBId,
      'b-key',
      'b-secret',
      'b-replacement-key',
      'b-replacement-secret',
    ]);
  });

  it(`[${IsolationMatrixRowId.Timeline}] denies a foreign workspace before Timeline read`, async () => {
    const fixture = await createDualWorkspaceIsolationFixture();
    const auditRepository = new InMemoryCrossProductAuditRepository();
    const timeline = new SecurityAuditTimelineService(
      auditRepository,
      new EmptyIncidentRepository(),
    );
    const controller = new SecurityAuditTimelineController(timeline, fixture.access);
    const read = vi.spyOn(timeline, 'readWorkspaceTimeline');

    await expect(
      controller.read(
        {
          user: {
            userId: fixture.operatorAId,
            email: 'operator-a@example.com',
            displayName: 'Operator A',
            role: Role.Admin,
          },
        },
        fixture.workspaceB.id,
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(read).not.toHaveBeenCalled();
  });
});
