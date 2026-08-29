import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformQueueAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-queue-anchor';
import {
  prepareNotificationPlatformQueueAnchorsForRecovery,
  NotificationPlatformQueueRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-queue-restart-recovery';
import { PrismaNotificationPlatformQueueAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-queue-anchor.repository';
import { NotificationPlatformQueueRecoveryStore } from '../modules/notification-delivery/notification-platform-queue-recovery-store';
import { NotificationPlatformQueueRestartRecoveryService } from '../modules/notification-delivery/notification-platform-queue-restart-recovery.service';
import {
  W5_N08_C_ARCHITECTURE_CLAIMS,
  W5_N08_C_EXPLICIT_OUT,
  W5_N08_C_NOTIFICATION_OWNER,
  W5_N08_C_RECOVERED_ARTIFACT_IDS,
  W5_N08_C_SLICE_ID,
  W5_N08_C_TECHNICAL_DEBT_DELTA,
  W5_N08_C_TRANSITION_MATRIX,
} from './w5-n08-c-notification-platform-queue-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-29T20:00:00.000Z';

function canonicalAnchor(workspaceId: string, queueAnchorId: string) {
  const outcome = buildNotificationPlatformQueueAnchorState({
    workspaceId,
    queueAnchorId,
    platformQueueType: 'unified-platform-queue',
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
    rows.map((row) => [`${row.workspaceId as string}:${row.queueAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformQueueAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.queueAnchorId).localeCompare(String(b.queueAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_queueAnchorId: { workspaceId, queueAnchorId },
        },
      }: {
        where: {
          workspaceId_queueAnchorId: {
            workspaceId: string;
            queueAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${queueAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    queueAnchorId: anchor.queueAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformQueueType: anchor.platformQueueType,
    queueState: anchor.queueState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N08-c notification platform queue restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N08_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'queue-1'),
      integrityMetadata: '{"workspaceId":"ws-1","queueAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformQueueAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformQueueRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformQueueAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformQueueRestartRecoveryService(
      repository,
      new NotificationPlatformQueueRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'queue-1')).toBeNull();
  });
});

describe('W5-N08-c notification platform queue restart recovery — integration', () => {
  it('recover persisted notification platform queue anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'queue-1');
    const repository = new PrismaNotificationPlatformQueueAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformQueueRecoveryStore();
    const service = new NotificationPlatformQueueRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'queue-1')?.platformQueueType).toBe(
      'unified-platform-queue',
    );
    expect(W5_N08_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N08_C_ARCHITECTURE_CLAIMS.notificationPlatformQueueAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'queue-2');
    const service = new NotificationPlatformQueueRestartRecoveryService(
      new PrismaNotificationPlatformQueueAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformQueueRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N08_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N08_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N08_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N08_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N08_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N08_C_ARCHITECTURE_CLAIMS.queueWorkersImplemented).toBe(false);
    expect(W5_N08_C_ARCHITECTURE_CLAIMS.schedulerImplemented).toBe(false);
    expect(W5_N08_C_ARCHITECTURE_CLAIMS.retryOrchestrationImplemented).toBe(false);
  });

  it('recovered artifact ids reference W5-N08-b persistence foundation', () => {
    expect(W5_N08_C_RECOVERED_ARTIFACT_IDS).toEqual(['persist-notification-platform-queue-anchor']);
  });

  it('transition matrix: persistence + recovery; operational continuity still missing', () => {
    expect(W5_N08_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N08-b)');
    expect(W5_N08_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N08-c)');
    expect(
      W5_N08_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Operational')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; continuity deferred', () => {
    expect(W5_N08_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N08_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(
      W5_N08_C_TECHNICAL_DEBT_DELTA.deferred.some((item) =>
        item.toLowerCase().includes('continuity'),
      ),
    ).toBe(true);
  });

  it('explicit OUT covers operational continuity and W5-N08-d', () => {
    expect(W5_N08_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['operational-continuity', 'w5-n08-d']),
    );
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n08-c-implementation-report.md',
      'w5-n08-c-architecture-review.md',
      'w5-n08-c-security-review.md',
      'w5-n08-c-product-review.md',
      'w5-n08-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/notification-platform-queue-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-queue-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-queue-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/notification-platform-queue-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N08-c', () => {
    expect(W5_N08_C_SLICE_ID).toBe('W5-N08-c');
  });
});
