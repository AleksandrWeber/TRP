import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformDispatchAnchorState,
  type DurableNotificationPlatformDispatchAnchor,
} from './domain/durable-notification-platform-dispatch-anchor';
import type { NotificationPlatformDispatchAnchorRepository } from './domain/notification-platform-dispatch-anchor.repository';
import { NotificationPlatformDispatchPersistenceService } from './notification-platform-dispatch-persistence.service';

const recordedAt = '2026-08-29T19:30:00.000Z';

function createRepository(): NotificationPlatformDispatchAnchorRepository & {
  saved: DurableNotificationPlatformDispatchAnchor[];
} {
  const saved: DurableNotificationPlatformDispatchAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformDispatchAnchor>();

  return {
    saved,
    saveNotificationPlatformDispatchAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.dispatchAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformDispatchAnchor: vi.fn(
      async (workspaceId, dispatchAnchorId) =>
        byKey.get(`${workspaceId}:${dispatchAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformDispatchAnchors: vi.fn(async () => saved),
  };
}

describe('NotificationPlatformDispatchPersistenceService — W5-N07-b storage only', () => {
  it('persistDispatchAnchor writes canonical platform dispatch anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformDispatchPersistenceService(repository);

    const outcome = await service.persistDispatchAnchor({
      workspaceId: 'ws-1',
      dispatchAnchorId: 'disp-1',
      platformDispatchType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      dispatchAnchorId: 'disp-1',
      platformDispatchType: 'cross-channel-foundation',
      dispatchState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('disp-1');
    expect(await service.loadAnchor('ws-1', 'disp-1')).toMatchObject({
      dispatchAnchorId: 'disp-1',
    });
  });

  it('does not persist dispatcher, retry, scheduler, queue worker, or transport execution fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformDispatchPersistenceService(repository);

    await service.persistDispatchAnchor({
      workspaceId: 'ws-1',
      dispatchAnchorId: 'disp-2',
      platformDispatchType: 'platform-dispatch-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('dispatcherState');
    expect(anchor).not.toHaveProperty('retryState');
    expect(anchor).not.toHaveProperty('schedulerState');
    expect(anchor).not.toHaveProperty('queueWorkerState');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformDispatchAnchor = {
      workspaceId: 'ws-1',
      dispatchAnchorId: 'disp-3',
      platformDispatchType: 'cross-channel-foundation',
      dispatchState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformDispatchAnchorState({
      workspaceId: 'ws-2',
      dispatchAnchorId: 'disp-3',
      platformDispatchType: 'cross-channel-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
