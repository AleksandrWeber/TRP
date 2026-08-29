import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformWorkerExecutionAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-worker-execution-anchor';
import {
  prepareNotificationPlatformWorkerExecutionAnchorsForRecovery,
  NotificationPlatformWorkerExecutionRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-worker-execution-restart-recovery';
import { PrismaNotificationPlatformWorkerExecutionAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-worker-execution-anchor.repository';
import { NotificationPlatformWorkerExecutionRecoveryStore } from '../modules/notification-delivery/notification-platform-worker-execution-recovery-store';
import { NotificationPlatformWorkerExecutionRestartRecoveryService } from '../modules/notification-delivery/notification-platform-worker-execution-restart-recovery.service';
import {
  W5_N10_C_ARCHITECTURE_CLAIMS,
  W5_N10_C_EXPLICIT_OUT,
  W5_N10_C_NOTIFICATION_OWNER,
  W5_N10_C_RECOVERED_ARTIFACT_IDS,
  W5_N10_C_SLICE_ID,
  W5_N10_C_TECHNICAL_DEBT_DELTA,
  W5_N10_C_TRANSITION_MATRIX,
} from './w5-n10-c-notification-platform-worker-execution-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-29T22:00:00.000Z';

function canonicalAnchor(workspaceId: string, workerExecutionAnchorId: string) {
  const outcome = buildNotificationPlatformWorkerExecutionAnchorState({
    workspaceId,
    workerExecutionAnchorId,
    platformWorkerExecutionType: 'unified-platform-worker-execution',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

function createPrismaMock(rows: Record<string, unknown>[]) {
  const store = new Map(
    rows.map((row) => [
      `${row.workspaceId as string}:${row.workerExecutionAnchorId as string}`,
      row,
    ]),
  );
  return {
    workspaceNotificationPlatformWorkerExecutionAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.workerExecutionAnchorId).localeCompare(String(b.workerExecutionAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_workerExecutionAnchorId: { workspaceId, workerExecutionAnchorId },
        },
      }: {
        where: {
          workspaceId_workerExecutionAnchorId: {
            workspaceId: string;
            workerExecutionAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${workerExecutionAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    workerExecutionAnchorId: anchor.workerExecutionAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformWorkerExecutionType: anchor.platformWorkerExecutionType,
    workerExecutionState: anchor.workerExecutionState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N10-c notification platform worker execution restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N10_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'worker-exec-1'),
      integrityMetadata: '{"workspaceId":"ws-1","workerExecutionAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformWorkerExecutionAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformWorkerExecutionRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformWorkerExecutionAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformWorkerExecutionRestartRecoveryService(
      repository,
      new NotificationPlatformWorkerExecutionRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'worker-exec-1')).toBeNull();
  });
});

describe('W5-N10-c notification platform worker execution restart recovery — integration', () => {
  it('recover persisted notification platform worker execution anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'worker-exec-1');
    const repository = new PrismaNotificationPlatformWorkerExecutionAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformWorkerExecutionRecoveryStore();
    const service = new NotificationPlatformWorkerExecutionRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'worker-exec-1')?.platformWorkerExecutionType).toBe(
      'unified-platform-worker-execution',
    );
    expect(W5_N10_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N10_C_ARCHITECTURE_CLAIMS.notificationPlatformWorkerExecutionAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'worker-exec-2');
    const service = new NotificationPlatformWorkerExecutionRestartRecoveryService(
      new PrismaNotificationPlatformWorkerExecutionAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformWorkerExecutionRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N10_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N10_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N10_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N10_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N10_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N10_C_ARCHITECTURE_CLAIMS.workerRuntimeImplemented).toBe(false);
    expect(W5_N10_C_ARCHITECTURE_CLAIMS.schedulerImplemented).toBe(false);
    expect(W5_N10_C_ARCHITECTURE_CLAIMS.retryOrchestrationImplemented).toBe(false);
    expect(W5_N10_C_ARCHITECTURE_CLAIMS.deadLetterProcessingImplemented).toBe(false);
  });

  it('recovered artifact ids reference W5-N10-b persistence foundation', () => {
    expect(W5_N10_C_RECOVERED_ARTIFACT_IDS).toEqual([
      'persist-notification-platform-worker-execution-anchor',
    ]);
  });

  it('transition matrix: persistence + recovery; operational continuity still missing', () => {
    expect(W5_N10_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N10-b)');
    expect(W5_N10_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N10-c)');
    expect(
      W5_N10_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Operational')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; continuity deferred', () => {
    expect(W5_N10_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N10_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(
      W5_N10_C_TECHNICAL_DEBT_DELTA.deferred.some((item) =>
        item.toLowerCase().includes('continuity'),
      ),
    ).toBe(true);
  });

  it('explicit OUT covers operational continuity and W5-N10-d', () => {
    expect(W5_N10_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['operational-continuity', 'w5-n10-d']),
    );
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n10-c-implementation-report.md',
      'w5-n10-c-architecture-review.md',
      'w5-n10-c-security-review.md',
      'w5-n10-c-product-review.md',
      'w5-n10-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/notification-platform-worker-execution-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-worker-execution-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-worker-execution-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/notification-platform-worker-execution-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N10-c', () => {
    expect(W5_N10_C_SLICE_ID).toBe('W5-N10-c');
  });
});
