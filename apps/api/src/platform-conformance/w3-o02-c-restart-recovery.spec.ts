import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DurableNotificationStore } from '../modules/notification-delivery/adapters/durable-notification-store';
import {
  createPendingNotificationQueueItem,
  withNotificationQueueStatus,
} from '../modules/notification-delivery/domain/delivery-queue';
import {
  assertRecoverableNotificationQueue,
  buildNotificationQueueRecoveryDiagnostics,
  NotificationQueueRecoveryError,
  prepareNotificationStoreStateForRecovery,
  sortQueueItemsDeterministically,
} from '../modules/notification-delivery/domain/notification-queue-restart-recovery';
import { AnalyticalRestartRecoveryError } from '../persistence/analytical-restart-recovery';
import { saveOwnerStoreSnapshot } from '../persistence/analytical-owner-store-snapshot';
import { W3_O02_B_QUEUE_OWNER } from './w3-o02-b-durable-queue-persistence';
import {
  transitionSafetyAnswers,
  W3_O02_C_ARCHITECTURE_CLAIMS,
  W3_O02_C_EXPLICIT_OUT,
  W3_O02_C_OPEN_STATUSES,
  W3_O02_C_QUEUE_OWNER,
  W3_O02_C_SLICE_ID,
  W3_O02_C_TECHNICAL_DEBT_DELTA,
  W3_O02_C_TRANSITION_MATRIX,
} from './w3-o02-c-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');

function createSnapshotPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    analyticalOwnerStoreSnapshot: {
      findUnique: async ({ where: { owner } }: { where: { owner: string } }) => {
        if (!rows.has(owner)) return null;
        return { owner, payload: rows.get(owner) };
      },
      upsert: async ({
        where: { owner },
        create,
        update,
      }: {
        where: { owner: string };
        create: { owner: string; payload: unknown };
        update: { payload: unknown };
      }) => {
        const payload = rows.has(owner) ? update.payload : create.payload;
        rows.set(owner, payload);
        return { owner, payload };
      },
    },
    _rows: rows,
  };
}

describe('W3-O02-c notification queue restart recovery — unit', () => {
  it('recovery ordering: queue items sort by createdAt then queueItemId', () => {
    const later = createPendingNotificationQueueItem({
      queueItemId: 'nq-b',
      command: {
        workspaceId: 'ws-1',
        userId: 'u-1',
        type: 'daily-report',
        subject: 'B',
        body: 'B',
        requestedAt: '2026-08-27T12:00:02.000Z',
      },
    });
    const earlier = createPendingNotificationQueueItem({
      queueItemId: 'nq-a',
      command: {
        workspaceId: 'ws-1',
        userId: 'u-1',
        type: 'daily-report',
        subject: 'A',
        body: 'A',
        requestedAt: '2026-08-27T12:00:01.000Z',
      },
    });
    const ordered = sortQueueItemsDeterministically([later, earlier]);
    expect(ordered.map((item) => item.queueItemId)).toEqual(['nq-a', 'nq-b']);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.recoveryDeterministic).toBe(true);
  });

  it('recovery integrity: valid queue recovers; missing queue is empty', () => {
    const item = createPendingNotificationQueueItem({
      queueItemId: 'nq-1',
      command: {
        workspaceId: 'ws-1',
        userId: 'u-1',
        type: 'daily-report',
        subject: 'S',
        body: 'B',
        requestedAt: '2026-08-27T12:00:00.000Z',
      },
    });
    expect(assertRecoverableNotificationQueue({ queue: [item] })).toHaveLength(1);
    expect(assertRecoverableNotificationQueue({})).toEqual([]);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingItems).toBe(false);
  });

  it('recovery integrity: corrupted queue fails honestly', () => {
    expect(() => assertRecoverableNotificationQueue({ queue: 'not-an-array' })).toThrow(
      NotificationQueueRecoveryError,
    );
    expect(() =>
      assertRecoverableNotificationQueue({
        queue: [{ queueItemId: 'x' }],
      }),
    ).toThrow(/corrupt/i);
    expect(() =>
      prepareNotificationStoreStateForRecovery({
        preferences: [],
        telegram: [],
        deliveries: [],
        queue: [{ queueItemId: 'bad' }],
      }),
    ).toThrow(AnalyticalRestartRecoveryError);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedItems).toBe(false);
  });

  it('diagnostics: build open counts without fabricating', () => {
    const pending = createPendingNotificationQueueItem({
      queueItemId: 'nq-open',
      command: {
        workspaceId: 'ws-a',
        userId: 'u-1',
        type: 'daily-report',
        subject: 'Open',
        body: 'Body',
        requestedAt: '2026-08-27T12:00:00.000Z',
      },
    });
    const completed = withNotificationQueueStatus(pending, 'completed', {
      updatedAt: '2026-08-27T12:01:00.000Z',
      deliveryId: 'del-1',
    });
    const diagnostics = buildNotificationQueueRecoveryDiagnostics([
      pending,
      { ...completed, queueItemId: 'nq-done' },
    ]);
    expect(diagnostics.restoredCount).toBe(2);
    expect(diagnostics.openCount).toBe(1);
    expect(diagnostics.byStatus.pending).toBe(1);
    expect(diagnostics.byStatus.completed).toBe(1);
    expect(diagnostics.workspaceIds).toEqual(['ws-a']);
  });
});

describe('W3-O02-c notification queue restart recovery — integration', () => {
  it('recover persisted open queue after normal restart (new store + hydrate)', async () => {
    const prisma = createSnapshotPrismaMock();
    const writer = new DurableNotificationStore(prisma as never);
    await writer.hydrate();

    for (const status of W3_O02_C_OPEN_STATUSES) {
      const base = createPendingNotificationQueueItem({
        queueItemId: `nq-${status}`,
        command: {
          workspaceId: 'ws-recover',
          userId: 'u-1',
          type: 'daily-report',
          subject: status,
          body: 'owed',
          requestedAt: `2026-08-27T16:00:0${status === 'pending' ? 0 : status === 'in-flight' ? 1 : 2}.000Z`,
        },
      });
      writer.saveQueueItem(
        status === 'pending'
          ? base
          : withNotificationQueueStatus(base, status, {
              updatedAt: base.updatedAt,
            }),
      );
    }

    const reader = new DurableNotificationStore(prisma as never);
    await reader.hydrate();

    expect(reader.getQueueItem('nq-pending')?.status).toBe('pending');
    expect(reader.getQueueItem('nq-in-flight')?.status).toBe('in-flight');
    expect(reader.getQueueItem('nq-retryable')?.status).toBe('retryable');
    expect(reader.listQueueItems({ workspaceId: 'ws-recover', openOnly: true })).toHaveLength(3);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.queuedNotificationsSurviveRestartClaimed).toBe(true);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields the same queue state', async () => {
    const prisma = createSnapshotPrismaMock();
    const writer = new DurableNotificationStore(prisma as never);
    await writer.hydrate();
    writer.saveQueueItem(
      createPendingNotificationQueueItem({
        queueItemId: 'nq-idem',
        command: {
          workspaceId: 'ws-idem',
          userId: 'u-1',
          type: 'session-finished',
          subject: 'Idem',
          body: 'Body',
          requestedAt: '2026-08-27T17:00:00.000Z',
        },
      }),
    );

    const store = new DurableNotificationStore(prisma as never);
    await store.hydrate();
    const first = store.exportDurableState().queue;
    await store.hydrate();
    const second = store.exportDurableState().queue;
    expect(second).toEqual(first);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.recoveryIdempotent).toBe(true);
  });

  it('recovery with missing queue items: empty snapshot stays empty (no fabrication)', async () => {
    const prisma = createSnapshotPrismaMock();
    const store = new DurableNotificationStore(prisma as never);
    await store.hydrate();
    expect(store.listQueueItems({ workspaceId: 'ws-any' })).toEqual([]);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingItems).toBe(false);
  });

  it('recovery with corrupted queue items: hydrate fails honestly', async () => {
    const prisma = createSnapshotPrismaMock();
    await saveOwnerStoreSnapshot(prisma as never, 'notification-delivery', {
      preferences: [],
      telegram: [],
      deliveries: [],
      queue: [{ queueItemId: 'corrupt-only' }],
    });

    const store = new DurableNotificationStore(prisma as never);
    await expect(store.hydrate()).rejects.toBeInstanceOf(AnalyticalRestartRecoveryError);
    expect(store.listQueueItems({ workspaceId: 'ws-any' })).toEqual([]);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedItems).toBe(false);
  });

  it('workspace isolation preserved after recovery', async () => {
    const prisma = createSnapshotPrismaMock();
    const writer = new DurableNotificationStore(prisma as never);
    await writer.hydrate();
    writer.saveQueueItem(
      createPendingNotificationQueueItem({
        queueItemId: 'nq-a',
        command: {
          workspaceId: 'ws-a',
          userId: 'u-1',
          type: 'daily-report',
          subject: 'A',
          body: 'A',
          requestedAt: '2026-08-27T18:00:00.000Z',
        },
      }),
    );
    writer.saveQueueItem(
      createPendingNotificationQueueItem({
        queueItemId: 'nq-b',
        command: {
          workspaceId: 'ws-b',
          userId: 'u-1',
          type: 'daily-report',
          subject: 'B',
          body: 'B',
          requestedAt: '2026-08-27T18:00:01.000Z',
        },
      }),
    );

    const reader = new DurableNotificationStore(prisma as never);
    await reader.hydrate();
    expect(reader.listQueueItems({ workspaceId: 'ws-a' }).map((i) => i.queueItemId)).toEqual([
      'nq-a',
    ]);
    expect(reader.listQueueItems({ workspaceId: 'ws-b' }).map((i) => i.queueItemId)).toEqual([
      'nq-b',
    ]);
  });

  it('architecture / governance claims remain inventory-safe', () => {
    expect(W3_O02_C_SLICE_ID).toBe('W3-O02-c');
    expect(W3_O02_C_QUEUE_OWNER).toBe(W3_O02_B_QUEUE_OWNER);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.secondRecoveryEngine).toBe(false);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.newOutbox).toBe(false);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.ownershipDiagramChanged).toBe(false);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.boundedContextChanged).toBe(false);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.sourceOfTruthChanged).toBe(false);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.retryExecutionImplemented).toBe(false);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.customerVisibleRecoveryUi).toBe(false);
    expect(transitionSafetyAnswers().recoveryUsesExistingHydratePath).toBe(true);
    expect(W3_O02_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['retry-execution', 'second-recovery-engine', 'w3-o02-d']),
    );
    expect(W3_O02_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W3_O02_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W3_O02_C_TRANSITION_MATRIX.stillMissing).toEqual(
      expect.arrayContaining([expect.stringMatching(/Retry/), expect.stringMatching(/Close/)]),
    );
  });

  it('required reports exist for W3-O02-c', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o02-c-implementation-report.md',
      'w3-o02-c-architecture-review.md',
      'w3-o02-c-security-review.md',
      'w3-o02-c-product-review.md',
      'w3-o02-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});
