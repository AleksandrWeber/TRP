import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetrySchedulingDecisionProjectionAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-scheduling-decision-projection-anchor';
import {
  prepareNotificationPlatformRetrySchedulingDecisionProjectionAnchorsForRecovery,
  NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-restart-recovery';
import { NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryService } from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-restart-recovery.service';
import { NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-recovery-store';
import { PrismaNotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-retry-scheduling-decision-projection-anchor.repository';
import {
  W5_N27_C_ARCHITECTURE_CLAIMS,
  W5_N27_C_EXPLICIT_OUT,
  W5_N27_C_NOTIFICATION_OWNER,
  W5_N27_C_RECOVERED_ARTIFACT_IDS,
  W5_N27_C_SLICE_ID,
  W5_N27_C_TECHNICAL_DEBT_DELTA,
  W5_N27_C_TRANSITION_MATRIX,
} from './w5-n27-c-notification-platform-retry-scheduling-decision-projection-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-13T22:00:00.000Z';

function canonicalAnchor(workspaceId: string, projectionAnchorId: string) {
  const outcome = buildNotificationPlatformRetrySchedulingDecisionProjectionAnchorState({
    workspaceId,
    projectionAnchorId,
    platformRetrySchedulingDecisionProjectionType: 'decision-projection-description-foundation',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical decision anchor');
  return outcome.anchor;
}

function createPrismaMock(rows: Record<string, unknown>[]) {
  const store = new Map(
    rows.map((row) => [`${row.workspaceId as string}:${row.projectionAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformRetrySchedulingDecisionProjectionAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.projectionAnchorId).localeCompare(String(b.projectionAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_projectionAnchorId: { workspaceId, projectionAnchorId },
        },
      }: {
        where: {
          workspaceId_projectionAnchorId: {
            workspaceId: string;
            projectionAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${projectionAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    projectionAnchorId: anchor.projectionAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetrySchedulingDecisionProjectionType:
      anchor.platformRetrySchedulingDecisionProjectionType,
    projectionAnchorState: anchor.projectionAnchorState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N27-c notification platform retry scheduling decision projection restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N27_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'projection-anchor-1'),
      integrityMetadata: '{"workspaceId":"ws-1","projectionAnchorId":"wrong"}',
    });
    expect(() =>
      prepareNotificationPlatformRetrySchedulingDecisionProjectionAnchorsForRecovery([bad]),
    ).toThrow(NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError);
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository =
      new PrismaNotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository(
        createPrismaMock([]) as never,
      );
    const service = new NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryService(
      repository,
      new NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'projection-anchor-1')).toBeNull();
  });
});

describe('W5-N27-c notification platform retry scheduling decision projection restart recovery — integration', () => {
  it('recover persisted decision anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'projection-anchor-1');
    const repository =
      new PrismaNotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      );
    const recoveryStore = new NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore();
    const service = new NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(
      service.getRecoveredAnchor('ws-1', 'projection-anchor-1')
        ?.platformRetrySchedulingDecisionProjectionType,
    ).toBe('decision-projection-description-foundation');
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N27_C_ARCHITECTURE_CLAIMS.notificationPlatformRetrySchedulingDecisionProjectionAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'projection-anchor-2');
    const service = new NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryService(
      new PrismaNotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity, runtime decision, or customer-visible feature', () => {
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.runtimeDecisionProjectionImplemented).toBe(false);
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.runtimeSchedulingImplemented).toBe(false);
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.backoffCalculationImplemented).toBe(false);
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.eligibilityDeterminationImplemented).toBe(false);
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.executionImplemented).toBe(false);
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(true);
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.runtimeDecisionEngineIntroduced).toBe(false);
    expect(W5_N27_C_ARCHITECTURE_CLAIMS.runtimeSchedulerIntroduced).toBe(false);
  });

  it('recovered artifact ids reference W5-N27-b persistence foundation', () => {
    expect(W5_N27_C_RECOVERED_ARTIFACT_IDS).toEqual(['persist-candidate-projection-anchor']);
  });

  it('transition matrix: persistence + recovery; operational continuity and package Close still missing', () => {
    expect(W5_N27_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N27-b)');
    expect(W5_N27_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N27-c)');
    expect(
      W5_N27_C_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational continuity'),
      ),
    ).toBe(true);
    expect(
      W5_N27_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; d–e deferred; nothing introduced', () => {
    expect(W5_N27_C_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Retry Scheduling Decision Projection Restart Recovery Foundation',
    );
    expect(W5_N27_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N27_C_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N27-d — Operational Continuity Foundation',
      'W5-N27-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers decision runtime, scheduling, eligibility, backoff, execution, and operational continuity', () => {
    expect(W5_N27_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'runtime-decision-logic',
        'runtime-scheduling',
        'eligibility-determination',
        'backoff-calculation',
        'retry-execution',
        'operational-continuity',
      ]),
    );
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n27-c-implementation-report.md',
      'w5-n27-c-architecture-review.md',
      'w5-n27-c-security-review.md',
      'w5-n27-c-product-review.md',
      'w5-n27-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N27-c', () => {
    expect(W5_N27_C_SLICE_ID).toBe('W5-N27-c');
  });
});
