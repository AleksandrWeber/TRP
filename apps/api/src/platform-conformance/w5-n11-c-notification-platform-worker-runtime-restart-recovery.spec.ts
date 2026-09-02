import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformWorkerRuntimeAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-worker-runtime-anchor';
import {
  prepareNotificationPlatformWorkerRuntimeAnchorsForRecovery,
  NotificationPlatformWorkerRuntimeRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-worker-runtime-restart-recovery';
import { PrismaNotificationPlatformWorkerRuntimeAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-worker-runtime-anchor.repository';
import { NotificationPlatformWorkerRuntimeRecoveryStore } from '../modules/notification-delivery/notification-platform-worker-runtime-recovery-store';
import { NotificationPlatformWorkerRuntimeRestartRecoveryService } from '../modules/notification-delivery/notification-platform-worker-runtime-restart-recovery.service';
import {
  W5_N11_C_ARCHITECTURE_CLAIMS,
  W5_N11_C_EXPLICIT_OUT,
  W5_N11_C_NOTIFICATION_OWNER,
  W5_N11_C_RECOVERED_ARTIFACT_IDS,
  W5_N11_C_SLICE_ID,
  W5_N11_C_TECHNICAL_DEBT_DELTA,
  W5_N11_C_TRANSITION_MATRIX,
} from './w5-n11-c-notification-platform-worker-runtime-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-02T14:00:00.000Z';

function canonicalAnchor(workspaceId: string, workerRuntimeAnchorId: string) {
  const outcome = buildNotificationPlatformWorkerRuntimeAnchorState({
    workspaceId,
    workerRuntimeAnchorId,
    platformWorkerRuntimeType: 'unified-platform-worker-runtime',
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
    rows.map((row) => [`${row.workspaceId as string}:${row.workerRuntimeAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformWorkerRuntimeAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.workerRuntimeAnchorId).localeCompare(String(b.workerRuntimeAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_workerRuntimeAnchorId: { workspaceId, workerRuntimeAnchorId },
        },
      }: {
        where: {
          workspaceId_workerRuntimeAnchorId: {
            workspaceId: string;
            workerRuntimeAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${workerRuntimeAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    workerRuntimeAnchorId: anchor.workerRuntimeAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformWorkerRuntimeType: anchor.platformWorkerRuntimeType,
    workerRuntimeState: anchor.workerRuntimeState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N11-c notification platform worker runtime restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N11_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'worker-runtime-1'),
      integrityMetadata: '{"workspaceId":"ws-1","workerRuntimeAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformWorkerRuntimeAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformWorkerRuntimeRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformWorkerRuntimeAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformWorkerRuntimeRestartRecoveryService(
      repository,
      new NotificationPlatformWorkerRuntimeRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'worker-runtime-1')).toBeNull();
  });
});

describe('W5-N11-c notification platform worker runtime restart recovery — integration', () => {
  it('recover persisted notification platform worker runtime anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'worker-runtime-1');
    const repository = new PrismaNotificationPlatformWorkerRuntimeAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformWorkerRuntimeRecoveryStore();
    const service = new NotificationPlatformWorkerRuntimeRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'worker-runtime-1')?.platformWorkerRuntimeType).toBe(
      'unified-platform-worker-runtime',
    );
    expect(W5_N11_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N11_C_ARCHITECTURE_CLAIMS.notificationPlatformWorkerRuntimeAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'worker-runtime-2');
    const service = new NotificationPlatformWorkerRuntimeRestartRecoveryService(
      new PrismaNotificationPlatformWorkerRuntimeAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformWorkerRuntimeRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N11_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N11_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N11_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N11_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N11_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N11_C_ARCHITECTURE_CLAIMS.workerRuntimeExecutionImplemented).toBe(false);
    expect(W5_N11_C_ARCHITECTURE_CLAIMS.schedulerImplemented).toBe(false);
    expect(W5_N11_C_ARCHITECTURE_CLAIMS.retryOrchestrationImplemented).toBe(false);
    expect(W5_N11_C_ARCHITECTURE_CLAIMS.deadLetterProcessingImplemented).toBe(false);
  });

  it('recovered artifact ids reference W5-N11-b persistence foundation', () => {
    expect(W5_N11_C_RECOVERED_ARTIFACT_IDS).toEqual([
      'persist-notification-platform-worker-runtime-anchor',
    ]);
  });

  it('transition matrix: persistence + recovery; package close still missing', () => {
    expect(W5_N11_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N11-b)');
    expect(W5_N11_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N11-c)');
    expect(
      W5_N11_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; operational continuity deferred', () => {
    expect(W5_N11_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N11_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(
      W5_N11_C_TECHNICAL_DEBT_DELTA.deferred.some((item) =>
        item.toLowerCase().includes('continuity'),
      ),
    ).toBe(true);
  });

  it('explicit OUT covers worker runtime execution only (not operational continuity)', () => {
    expect(W5_N11_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['platform-worker-runtime-execution']),
    );
    expect(W5_N11_C_EXPLICIT_OUT).not.toContain('w5-n11-d');
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n11-c-implementation-report.md',
      'w5-n11-c-architecture-review.md',
      'w5-n11-c-security-review.md',
      'w5-n11-c-product-review.md',
      'w5-n11-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/notification-platform-worker-runtime-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-worker-runtime-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-worker-runtime-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/notification-platform-worker-runtime-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N11-c', () => {
    expect(W5_N11_C_SLICE_ID).toBe('W5-N11-c');
  });
});
