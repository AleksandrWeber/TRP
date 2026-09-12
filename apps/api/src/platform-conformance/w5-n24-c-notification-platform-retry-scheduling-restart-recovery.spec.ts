import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetrySchedulingAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-scheduling-anchor';
import {
  prepareNotificationPlatformRetrySchedulingAnchorsForRecovery,
  NotificationPlatformRetrySchedulingRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-restart-recovery';
import { NotificationPlatformRetrySchedulingRestartRecoveryService } from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-restart-recovery.service';
import { NotificationPlatformRetrySchedulingRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-recovery-store';
import { PrismaNotificationPlatformRetrySchedulingAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-retry-scheduling-anchor.repository';
import { W5_N24_A_BINDING_FINDINGS } from './w5-n24-a-retry-scheduling-inventory';
import {
  W5_N24_C_ARCHITECTURE_CLAIMS,
  W5_N24_C_EXPLICIT_OUT,
  W5_N24_C_NOTIFICATION_OWNER,
  W5_N24_C_RECOVERED_ARTIFACT_IDS,
  W5_N24_C_SLICE_ID,
  W5_N24_C_TECHNICAL_DEBT_DELTA,
  W5_N24_C_TRANSITION_MATRIX,
} from './w5-n24-c-notification-platform-retry-scheduling-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-12T22:30:00.000Z';

function canonicalAnchor(workspaceId: string, retrySchedulingAnchorId: string) {
  const outcome = buildNotificationPlatformRetrySchedulingAnchorState({
    workspaceId,
    retrySchedulingAnchorId,
    platformRetrySchedulingType: 'when-to-schedule-description-foundation',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical scheduling anchor');
  return outcome.anchor;
}

function createPrismaMock(rows: Record<string, unknown>[]) {
  const store = new Map(
    rows.map((row) => [
      `${row.workspaceId as string}:${row.retrySchedulingAnchorId as string}`,
      row,
    ]),
  );
  return {
    workspaceNotificationPlatformRetrySchedulingAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.retrySchedulingAnchorId).localeCompare(String(b.retrySchedulingAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_retrySchedulingAnchorId: { workspaceId, retrySchedulingAnchorId },
        },
      }: {
        where: {
          workspaceId_retrySchedulingAnchorId: {
            workspaceId: string;
            retrySchedulingAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${retrySchedulingAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    retrySchedulingAnchorId: anchor.retrySchedulingAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetrySchedulingType: anchor.platformRetrySchedulingType,
    retrySchedulingState: anchor.retrySchedulingState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N24-c notification platform retry scheduling restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N24_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'scheduling-anchor-1'),
      integrityMetadata: '{"workspaceId":"ws-1","retrySchedulingAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformRetrySchedulingAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformRetrySchedulingRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformRetrySchedulingAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformRetrySchedulingRestartRecoveryService(
      repository,
      new NotificationPlatformRetrySchedulingRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'scheduling-anchor-1')).toBeNull();
  });
});

describe('W5-N24-c notification platform retry scheduling restart recovery — integration', () => {
  it('recover persisted scheduling anchors after normal restart via consumed N19-c stack', async () => {
    const anchor = canonicalAnchor('ws-1', 'scheduling-anchor-1');
    const repository = new PrismaNotificationPlatformRetrySchedulingAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformRetrySchedulingRecoveryStore();
    const service = new NotificationPlatformRetrySchedulingRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(
      service.getRecoveredAnchor('ws-1', 'scheduling-anchor-1')?.platformRetrySchedulingType,
    ).toBe('when-to-schedule-description-foundation');
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N24_C_ARCHITECTURE_CLAIMS.notificationPlatformRetrySchedulingAnchorStateRestoredAfterRestart,
    ).toBe(true);
    expect(W5_N24_A_BINDING_FINDINGS.schedulingRecoveryMissing).toBe(false);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'scheduling-anchor-2');
    const service = new NotificationPlatformRetrySchedulingRestartRecoveryService(
      new PrismaNotificationPlatformRetrySchedulingAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformRetrySchedulingRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity, runtime scheduling, calc, eligibility, or execution', () => {
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.newRecoveryOwner).toBe(false);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.secondRecoveryEngine).toBe(false);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.runtimeSchedulingImplemented).toBe(false);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.backoffCalculationImplemented).toBe(false);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.eligibilityDeterminationImplemented).toBe(false);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.executionImplemented).toBe(false);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(true);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.recoveryDeterministic).toBe(true);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.recoveryIdempotent).toBe(true);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.schedulerEngineIntroduced).toBe(false);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.runtimeSchedulerIntroduced).toBe(false);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.n19SchedulingRestartRecoveryConsumed).toBe(true);
    expect(W5_N24_C_ARCHITECTURE_CLAIMS.newSchedulingRestartRecoveryStackIntroduced).toBe(false);
  });

  it('recovered artifact ids reference W5-N24-b persistence foundation', () => {
    expect(W5_N24_C_RECOVERED_ARTIFACT_IDS).toEqual(['persist-candidate-scheduling-anchor']);
  });

  it('transition matrix: persistence + recovery; operational continuity and package Close still missing', () => {
    expect(W5_N24_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N24-b)');
    expect(W5_N24_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N24-c)');
    expect(
      W5_N24_C_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational continuity'),
      ),
    ).toBe(true);
    expect(
      W5_N24_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; d–e deferred; nothing introduced', () => {
    expect(W5_N24_C_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Restart Recovery Foundation for Notification Retry Scheduling',
    );
    expect(W5_N24_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N24_C_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N24-d — Operational Continuity Foundation',
      'W5-N24-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers runtime scheduling, calc, eligibility, execution, and operational continuity', () => {
    expect(W5_N24_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'runtime-scheduling',
        'backoff-calculation',
        'retry-eligibility-determination',
        'retry-execution',
        'operational-continuity',
        'second-recovery-engine',
        'scheduler-engine',
        'runtime-scheduler',
      ]),
    );
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n24-c-implementation-report.md',
      'w5-n24-c-architecture-review.md',
      'w5-n24-c-security-review.md',
      'w5-n24-c-product-review.md',
      'w5-n24-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N24-c', () => {
    expect(W5_N24_C_SLICE_ID).toBe('W5-N24-c');
  });
});
