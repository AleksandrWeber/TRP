import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetryEligibilityAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-eligibility-anchor';
import {
  prepareNotificationPlatformRetryEligibilityAnchorsForRecovery,
  NotificationPlatformRetryEligibilityRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-retry-eligibility-restart-recovery';
import { NotificationPlatformRetryEligibilityRestartRecoveryService } from '../modules/notification-delivery/domain/notification-platform-retry-eligibility-restart-recovery.service';
import { NotificationPlatformRetryEligibilityRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-retry-eligibility-recovery-store';
import { PrismaNotificationPlatformRetryEligibilityAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-retry-eligibility-anchor.repository';
import {
  W5_N23_C_ARCHITECTURE_CLAIMS,
  W5_N23_C_EXPLICIT_OUT,
  W5_N23_C_NOTIFICATION_OWNER,
  W5_N23_C_RECOVERED_ARTIFACT_IDS,
  W5_N23_C_SLICE_ID,
  W5_N23_C_TECHNICAL_DEBT_DELTA,
  W5_N23_C_TRANSITION_MATRIX,
} from './w5-n23-c-notification-platform-retry-eligibility-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-12T22:00:00.000Z';

function canonicalAnchor(workspaceId: string, eligibilityAnchorId: string) {
  const outcome = buildNotificationPlatformRetryEligibilityAnchorState({
    workspaceId,
    eligibilityAnchorId,
    platformRetryEligibilityType: 'eligibility-description-foundation',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical eligibility anchor');
  return outcome.anchor;
}

function createPrismaMock(rows: Record<string, unknown>[]) {
  const store = new Map(
    rows.map((row) => [`${row.workspaceId as string}:${row.eligibilityAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformRetryEligibilityAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.eligibilityAnchorId).localeCompare(String(b.eligibilityAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_eligibilityAnchorId: { workspaceId, eligibilityAnchorId },
        },
      }: {
        where: {
          workspaceId_eligibilityAnchorId: {
            workspaceId: string;
            eligibilityAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${eligibilityAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    eligibilityAnchorId: anchor.eligibilityAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetryEligibilityType: anchor.platformRetryEligibilityType,
    eligibilityAnchorState: anchor.eligibilityAnchorState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N23-c notification platform retry eligibility restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N23_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'eligibility-anchor-1'),
      integrityMetadata: '{"workspaceId":"ws-1","eligibilityAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformRetryEligibilityAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformRetryEligibilityRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformRetryEligibilityAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformRetryEligibilityRestartRecoveryService(
      repository,
      new NotificationPlatformRetryEligibilityRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'eligibility-anchor-1')).toBeNull();
  });
});

describe('W5-N23-c notification platform retry eligibility restart recovery — integration', () => {
  it('recover persisted eligibility anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'eligibility-anchor-1');
    const repository = new PrismaNotificationPlatformRetryEligibilityAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformRetryEligibilityRecoveryStore();
    const service = new NotificationPlatformRetryEligibilityRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(
      service.getRecoveredAnchor('ws-1', 'eligibility-anchor-1')?.platformRetryEligibilityType,
    ).toBe('eligibility-description-foundation');
    expect(W5_N23_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N23_C_ARCHITECTURE_CLAIMS.notificationPlatformRetryEligibilityAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'eligibility-anchor-2');
    const service = new NotificationPlatformRetryEligibilityRestartRecoveryService(
      new PrismaNotificationPlatformRetryEligibilityAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformRetryEligibilityRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity, eligibility evaluation, or customer-visible feature', () => {
    expect(W5_N23_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N23_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N23_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N23_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N23_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N23_C_ARCHITECTURE_CLAIMS.eligibilityEvaluationImplemented).toBe(false);
    expect(W5_N23_C_ARCHITECTURE_CLAIMS.schedulingImplemented).toBe(false);
    expect(W5_N23_C_ARCHITECTURE_CLAIMS.executionImplemented).toBe(false);
    expect(W5_N23_C_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(true);
    expect(W5_N23_C_ARCHITECTURE_CLAIMS.eligibilityEngineIntroduced).toBe(false);
    expect(W5_N23_C_ARCHITECTURE_CLAIMS.schedulerIntroduced).toBe(false);
  });

  it('recovered artifact ids reference W5-N23-b persistence foundation', () => {
    expect(W5_N23_C_RECOVERED_ARTIFACT_IDS).toEqual(['persist-candidate-eligibility-anchor']);
  });

  it('transition matrix: persistence + recovery; operational continuity and package Close still missing', () => {
    expect(W5_N23_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N23-b)');
    expect(W5_N23_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N23-c)');
    expect(
      W5_N23_C_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational continuity'),
      ),
    ).toBe(true);
    expect(
      W5_N23_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; d–e deferred; nothing introduced', () => {
    expect(W5_N23_C_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Retry Eligibility Restart Recovery Foundation',
    );
    expect(W5_N23_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N23_C_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N23-d — Operational Continuity Foundation',
      'W5-N23-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers eligibility evaluation, scheduling, execution, and operational continuity', () => {
    expect(W5_N23_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'eligibility-evaluation-runtime',
        'retry-scheduling',
        'retry-execution',
        'operational-continuity',
      ]),
    );
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n23-c-implementation-report.md',
      'w5-n23-c-architecture-review.md',
      'w5-n23-c-security-review.md',
      'w5-n23-c-product-review.md',
      'w5-n23-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-eligibility-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-eligibility-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-eligibility-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-eligibility-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N23-c', () => {
    expect(W5_N23_C_SLICE_ID).toBe('W5-N23-c');
  });
});
