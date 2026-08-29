import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformQueueAnchorState,
  type DurableNotificationPlatformQueueAnchor,
} from './domain/durable-notification-platform-queue-anchor';
import type { NotificationPlatformQueueAnchorRepository } from './domain/notification-platform-queue-anchor.repository';
import { NotificationPlatformQueuePersistenceService } from './notification-platform-queue-persistence.service';

const recordedAt = '2026-08-29T20:00:00.000Z';

function createRepository(): NotificationPlatformQueueAnchorRepository & {
  saved: DurableNotificationPlatformQueueAnchor[];
} {
  const saved: DurableNotificationPlatformQueueAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformQueueAnchor>();

  return {
    saved,
    saveNotificationPlatformQueueAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.queueAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformQueueAnchor: vi.fn(
      async (workspaceId, queueAnchorId) => byKey.get(`${workspaceId}:${queueAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformQueueAnchors: vi.fn(async () => saved),
  };
}

describe('NotificationPlatformQueuePersistenceService — W5-N08-b storage only', () => {
  it('persistQueueAnchor writes canonical platform queue anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformQueuePersistenceService(repository);

    const outcome = await service.persistQueueAnchor({
      workspaceId: 'ws-1',
      queueAnchorId: 'queue-1',
      platformQueueType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      queueAnchorId: 'queue-1',
      platformQueueType: 'cross-channel-foundation',
      queueState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('queue-1');
    expect(await service.loadAnchor('ws-1', 'queue-1')).toMatchObject({
      queueAnchorId: 'queue-1',
    });
  });

  it('does not persist queue workers, retry, scheduler, dispatcher, or transport execution fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformQueuePersistenceService(repository);

    await service.persistQueueAnchor({
      workspaceId: 'ws-1',
      queueAnchorId: 'queue-2',
      platformQueueType: 'platform-queue-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('queueWorkerState');
    expect(anchor).not.toHaveProperty('retryState');
    expect(anchor).not.toHaveProperty('schedulerState');
    expect(anchor).not.toHaveProperty('dispatcherState');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformQueueAnchor = {
      workspaceId: 'ws-1',
      queueAnchorId: 'queue-3',
      platformQueueType: 'cross-channel-foundation',
      queueState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformQueueAnchorState({
      workspaceId: 'ws-2',
      queueAnchorId: 'queue-3',
      platformQueueType: 'cross-channel-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
