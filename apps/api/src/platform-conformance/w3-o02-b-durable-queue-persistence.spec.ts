import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DurableNotificationStore } from '../modules/notification-delivery/adapters/durable-notification-store';
import { InMemoryNotificationStore } from '../modules/notification-delivery/adapters/in-memory-notification-store';
import {
  createPendingNotificationQueueItem,
  withNotificationQueueStatus,
} from '../modules/notification-delivery/domain/delivery-queue';
import { NotificationDeliveryService } from '../modules/notification-delivery/notification-delivery.service';
import { InMemoryTelegramAdapter } from '../modules/notification-delivery/adapters/in-memory-telegram.adapter';
import { loadOwnerStoreSnapshot } from '../persistence/analytical-owner-store-snapshot';
import { W3_O02_A_QUEUE_OWNER } from './w3-o02-a-notification-queue-inventory';
import {
  W3_O02_B_ARCHITECTURE_CLAIMS,
  W3_O02_B_EXPLICIT_OUT,
  W3_O02_B_PERSISTED_ARTIFACTS,
  W3_O02_B_QUEUE_OWNER,
  W3_O02_B_SLICE_ID,
  W3_O02_B_TECHNICAL_DEBT_DELTA,
} from './w3-o02-b-durable-queue-persistence';

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

describe('W3-O02-b durable queue persistence — unit', () => {
  it('queue persistence: DurableNotificationStore write-through persists queue items', async () => {
    const prisma = createSnapshotPrismaMock();
    const store = new DurableNotificationStore(prisma as never);
    await store.hydrate();

    const pending = createPendingNotificationQueueItem({
      queueItemId: 'nq-1',
      command: {
        workspaceId: 'ws-a',
        userId: 'user-1',
        type: 'daily-report',
        subject: 'Report ready',
        body: 'Body',
        requestedAt: '2026-08-27T12:00:00.000Z',
      },
    });
    store.saveQueueItem(pending);

    const saved = await loadOwnerStoreSnapshot(prisma as never, 'notification-delivery');
    expect(saved).toMatchObject({
      queue: [expect.objectContaining({ queueItemId: 'nq-1', status: 'pending' })],
    });
  });

  it('serialization: queue round-trips through export/import without Outbox fields', () => {
    const store = new InMemoryNotificationStore();
    const item = createPendingNotificationQueueItem({
      queueItemId: 'nq-ser',
      command: {
        workspaceId: 'ws-ser',
        userId: 'u-1',
        type: 'session-finished',
        subject: 'S',
        body: 'B',
        requestedAt: '2026-08-27T12:00:00.000Z',
      },
    });
    store.saveQueueItem(
      withNotificationQueueStatus(item, 'retryable', {
        updatedAt: '2026-08-27T12:01:00.000Z',
        detail: 'adapter-temp-fail',
      }),
    );

    const exported = store.exportDurableState();
    expect(exported.queue).toHaveLength(1);
    expect(JSON.stringify(exported)).not.toMatch(/dead_letter|OutboxEvent|publishing/);

    const restored = new InMemoryNotificationStore();
    restored.importDurableState(exported);
    expect(restored.getQueueItem('nq-ser')?.status).toBe('retryable');
    expect(restored.getQueueItem('nq-ser')?.workspaceId).toBe('ws-ser');
  });

  it('ownership: queue owner remains notification-delivery only', () => {
    expect(W3_O02_B_QUEUE_OWNER).toBe('notification-delivery');
    expect(W3_O02_B_QUEUE_OWNER).toBe(W3_O02_A_QUEUE_OWNER);
    for (const row of W3_O02_B_PERSISTED_ARTIFACTS) {
      expect(row.owner).toBe('notification-delivery');
    }
  });

  it('workspace isolation: listQueueItems never returns foreign workspace items', () => {
    const store = new InMemoryNotificationStore();
    store.saveQueueItem(
      createPendingNotificationQueueItem({
        queueItemId: 'nq-a',
        command: {
          workspaceId: 'ws-a',
          userId: 'u1',
          type: 'daily-report',
          subject: 'A',
          body: 'A',
          requestedAt: '2026-08-27T12:00:00.000Z',
        },
      }),
    );
    store.saveQueueItem(
      createPendingNotificationQueueItem({
        queueItemId: 'nq-b',
        command: {
          workspaceId: 'ws-b',
          userId: 'u1',
          type: 'daily-report',
          subject: 'B',
          body: 'B',
          requestedAt: '2026-08-27T12:00:00.000Z',
        },
      }),
    );

    const listedA = store.listQueueItems({ workspaceId: 'ws-a' });
    expect(listedA).toHaveLength(1);
    expect(listedA[0]?.queueItemId).toBe('nq-a');
    expect(store.listQueueItems({ workspaceId: 'ws-b' })[0]?.queueItemId).toBe('nq-b');
    expect(store.listQueueItems({ workspaceId: '' })).toEqual([]);
  });

  it('domain: missing workspace fails closed on enqueue factories', () => {
    expect(() =>
      createPendingNotificationQueueItem({
        queueItemId: 'nq-x',
        command: {
          workspaceId: '   ',
          userId: 'u1',
          type: 'daily-report',
          subject: 'X',
          body: 'X',
          requestedAt: '2026-08-27T12:00:00.000Z',
        },
      }),
    ).toThrow(/workspaceId/);
  });
});

describe('W3-O02-b durable queue persistence — integration', () => {
  it('persist queue item + workspace isolation via service internal API', () => {
    const store = new InMemoryNotificationStore();
    const telegram = new InMemoryTelegramAdapter();
    const service = new NotificationDeliveryService(store, telegram);

    const queued = service.enqueueDeliveryWork({
      workspaceId: 'ws-1',
      userId: 'user-1',
      type: 'daily-report',
      subject: 'Owed',
      body: 'Body',
      requestedAt: '2026-08-27T13:00:00.000Z',
    });
    expect(queued.status).toBe('pending');

    service.enqueueDeliveryWork({
      workspaceId: 'ws-2',
      userId: 'user-1',
      type: 'daily-report',
      subject: 'Other',
      body: 'Body',
      requestedAt: '2026-08-27T13:00:00.000Z',
    });

    expect(service.listDeliveryQueue({ workspaceId: 'ws-1' })).toHaveLength(1);
    expect(service.listDeliveryQueue({ workspaceId: 'ws-2' })).toHaveLength(1);
    expect(() => service.listDeliveryQueue({ workspaceId: '  ' })).toThrow(/workspaceId/);
  });

  it('persistence integrity: deliver() records queue terminal state with history', () => {
    const store = new InMemoryNotificationStore();
    const telegram = new InMemoryTelegramAdapter();
    const service = new NotificationDeliveryService(store, telegram);

    service.connectTelegram({
      workspaceId: 'ws-d',
      userId: 'u-d',
      requestedAt: '2026-08-27T14:00:00.000Z',
    });
    const token = store.getTelegram('ws-d', 'u-d')?.connectionToken;
    expect(token).toBeTruthy();
    service.completeTelegramConnect({
      connectionToken: token!,
      chatId: 'chat-1',
      completedAt: '2026-08-27T14:01:00.000Z',
    });

    const result = service.deliver({
      workspaceId: 'ws-d',
      userId: 'u-d',
      type: 'daily-report',
      subject: 'Done',
      body: 'Body',
      requestedAt: '2026-08-27T14:02:00.000Z',
    });
    expect(result.outcome).toBe('delivered');

    const queue = service.listDeliveryQueue({ workspaceId: 'ws-d' });
    expect(queue).toHaveLength(1);
    expect(queue[0]?.status).toBe('completed');
    expect(queue[0]?.deliveryId).toBe(result.deliveryId);
    expect(service.listDeliveries({ workspaceId: 'ws-d' })).toHaveLength(1);
  });

  it('restart preparation (NOT recovery): new store instance can load persisted queue snapshot', async () => {
    const prisma = createSnapshotPrismaMock();
    const writer = new DurableNotificationStore(prisma as never);
    await writer.hydrate();

    writer.saveQueueItem(
      createPendingNotificationQueueItem({
        queueItemId: 'nq-prep',
        command: {
          workspaceId: 'ws-prep',
          userId: 'u-prep',
          type: 'critical-platform-error',
          subject: 'Hold',
          body: 'In flight owed',
          requestedAt: '2026-08-27T15:00:00.000Z',
        },
      }),
    );
    writer.saveQueueItem(
      withNotificationQueueStatus(writer.getQueueItem('nq-prep')!, 'in-flight', {
        updatedAt: '2026-08-27T15:00:01.000Z',
      }),
    );

    const reader = new DurableNotificationStore(prisma as never);
    await reader.hydrate();
    expect(reader.getQueueItem('nq-prep')?.status).toBe('in-flight');
    expect(reader.getQueueItem('nq-prep')?.workspaceId).toBe('ws-prep');

    // Honesty: product must not claim automatic restart survival from this slice.
    expect(W3_O02_B_ARCHITECTURE_CLAIMS.queuedNotificationsSurviveRestartClaimed).toBe(false);
    expect(W3_O02_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
  });

  it('backward compatible: O01 snapshot without queue imports as empty queue', () => {
    const store = new InMemoryNotificationStore();
    store.importDurableState({
      preferences: [],
      telegram: [],
      deliveries: [],
    } as never);
    expect(store.listQueueItems({ workspaceId: 'ws-any' })).toEqual([]);
  });

  it('architecture: no second Outbox / owner / SoT; TD-045 ≠ TD-035', () => {
    expect(W3_O02_B_SLICE_ID).toBe('W3-O02-b');
    expect(W3_O02_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O02_B_ARCHITECTURE_CLAIMS.newOutbox).toBe(false);
    expect(W3_O02_B_ARCHITECTURE_CLAIMS.td045MergedIntoTd035).toBe(false);
    expect(W3_O02_B_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W3_O02_B_ARCHITECTURE_CLAIMS.ownershipDiagramChanged).toBe(false);
    expect(W3_O02_B_ARCHITECTURE_CLAIMS.boundedContextChanged).toBe(false);
    expect(W3_O02_B_ARCHITECTURE_CLAIMS.sourceOfTruthChanged).toBe(false);
    expect(W3_O02_B_ARCHITECTURE_CLAIMS.customerVisibleQueueUi).toBe(false);
    expect(W3_O02_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['restart-recovery', 'retry-execution', 'second-outbox', 'w3-o02-c']),
    );
  });

  it('technical debt delta is recorded', () => {
    expect(W3_O02_B_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W3_O02_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W3_O02_B_TECHNICAL_DEBT_DELTA.deferred).toEqual(
      expect.arrayContaining([expect.stringMatching(/W3-O02-c/), expect.stringMatching(/Wave 5/)]),
    );
  });

  it('evidence paths and required reports exist', () => {
    for (const row of W3_O02_B_PERSISTED_ARTIFACTS) {
      expect(existsSync(join(REPO_ROOT, row.durableAdapter))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.domainModel))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.storeEvidence))).toBe(true);
    }
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o02-b-implementation-report.md',
      'w3-o02-b-architecture-review.md',
      'w3-o02-b-security-review.md',
      'w3-o02-b-product-review.md',
      'w3-o02-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});
