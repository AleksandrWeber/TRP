import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetryBackoffCalculationAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-backoff-calculation-anchor';
import {
  prepareNotificationPlatformRetryBackoffCalculationAnchorsForRecovery,
  NotificationPlatformRetryBackoffCalculationRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-restart-recovery';
import { NotificationPlatformRetryBackoffCalculationRestartRecoveryService } from '../modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-restart-recovery.service';
import { NotificationPlatformRetryBackoffCalculationRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-recovery-store';
import { PrismaNotificationPlatformRetryBackoffCalculationAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-retry-backoff-calculation-anchor.repository';
import {
  W5_N22_C_ARCHITECTURE_CLAIMS,
  W5_N22_C_EXPLICIT_OUT,
  W5_N22_C_NOTIFICATION_OWNER,
  W5_N22_C_RECOVERED_ARTIFACT_IDS,
  W5_N22_C_SLICE_ID,
  W5_N22_C_TECHNICAL_DEBT_DELTA,
  W5_N22_C_TRANSITION_MATRIX,
} from './w5-n22-c-notification-platform-retry-backoff-calculation-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-12T22:00:00.000Z';

function canonicalAnchor(workspaceId: string, calculationAnchorId: string) {
  const outcome = buildNotificationPlatformRetryBackoffCalculationAnchorState({
    workspaceId,
    calculationAnchorId,
    platformBackoffCalculationType: 'backoff-calculation-description-foundation',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical calculation anchor');
  return outcome.anchor;
}

function createPrismaMock(rows: Record<string, unknown>[]) {
  const store = new Map(
    rows.map((row) => [`${row.workspaceId as string}:${row.calculationAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformRetryBackoffCalculationAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.calculationAnchorId).localeCompare(String(b.calculationAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_calculationAnchorId: { workspaceId, calculationAnchorId },
        },
      }: {
        where: {
          workspaceId_calculationAnchorId: {
            workspaceId: string;
            calculationAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${calculationAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    calculationAnchorId: anchor.calculationAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformBackoffCalculationType: anchor.platformBackoffCalculationType,
    calculationAnchorState: anchor.calculationAnchorState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N22-c notification platform retry backoff calculation restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N22_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'calc-anchor-1'),
      integrityMetadata: '{"workspaceId":"ws-1","calculationAnchorId":"wrong"}',
    });
    expect(() =>
      prepareNotificationPlatformRetryBackoffCalculationAnchorsForRecovery([bad]),
    ).toThrow(NotificationPlatformRetryBackoffCalculationRestartRecoveryError);
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformRetryBackoffCalculationAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformRetryBackoffCalculationRestartRecoveryService(
      repository,
      new NotificationPlatformRetryBackoffCalculationRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'calc-anchor-1')).toBeNull();
  });
});

describe('W5-N22-c notification platform retry backoff calculation restart recovery — integration', () => {
  it('recover persisted calculation anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'calc-anchor-1');
    const repository = new PrismaNotificationPlatformRetryBackoffCalculationAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformRetryBackoffCalculationRecoveryStore();
    const service = new NotificationPlatformRetryBackoffCalculationRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(
      service.getRecoveredAnchor('ws-1', 'calc-anchor-1')?.platformBackoffCalculationType,
    ).toBe('backoff-calculation-description-foundation');
    expect(W5_N22_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N22_C_ARCHITECTURE_CLAIMS.notificationPlatformRetryBackoffCalculationAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'calc-anchor-2');
    const service = new NotificationPlatformRetryBackoffCalculationRestartRecoveryService(
      new PrismaNotificationPlatformRetryBackoffCalculationAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformRetryBackoffCalculationRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity, calculation runtime, or customer-visible feature', () => {
    expect(W5_N22_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N22_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N22_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N22_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N22_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N22_C_ARCHITECTURE_CLAIMS.calculationRuntimeImplemented).toBe(false);
    expect(W5_N22_C_ARCHITECTURE_CLAIMS.schedulingImplemented).toBe(false);
    expect(W5_N22_C_ARCHITECTURE_CLAIMS.executionImplemented).toBe(false);
    expect(W5_N22_C_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(true);
    expect(W5_N22_C_ARCHITECTURE_CLAIMS.calculationEngineIntroduced).toBe(false);
    expect(W5_N22_C_ARCHITECTURE_CLAIMS.schedulerIntroduced).toBe(false);
  });

  it('recovered artifact ids reference W5-N22-b persistence foundation', () => {
    expect(W5_N22_C_RECOVERED_ARTIFACT_IDS).toEqual([
      'persist-candidate-backoff-calculation-anchor',
    ]);
  });

  it('transition matrix: persistence + recovery; operational continuity and package Close still missing', () => {
    expect(W5_N22_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N22-b)');
    expect(W5_N22_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N22-c)');
    expect(
      W5_N22_C_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational continuity'),
      ),
    ).toBe(true);
    expect(
      W5_N22_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; d–e deferred; nothing introduced', () => {
    expect(W5_N22_C_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Backoff Calculation Restart Recovery Foundation',
    );
    expect(W5_N22_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N22_C_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N22-d — Operational Continuity Foundation',
      'W5-N22-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers calculation runtime, scheduling, execution, and operational continuity', () => {
    expect(W5_N22_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'calculation-runtime',
        'retry-scheduling',
        'retry-execution',
        'operational-continuity',
      ]),
    );
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n22-c-implementation-report.md',
      'w5-n22-c-architecture-review.md',
      'w5-n22-c-security-review.md',
      'w5-n22-c-product-review.md',
      'w5-n22-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N22-c', () => {
    expect(W5_N22_C_SLICE_ID).toBe('W5-N22-c');
  });
});
