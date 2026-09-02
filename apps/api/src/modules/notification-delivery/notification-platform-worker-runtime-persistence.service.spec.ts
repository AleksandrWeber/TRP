import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformWorkerRuntimeAnchorState,
  type DurableNotificationPlatformWorkerRuntimeAnchor,
} from './domain/durable-notification-platform-worker-runtime-anchor';
import type { NotificationPlatformWorkerRuntimeAnchorRepository } from './domain/notification-platform-worker-runtime-anchor.repository';
import { NotificationPlatformWorkerRuntimePersistenceService } from './notification-platform-worker-runtime-persistence.service';

const recordedAt = '2026-09-02T14:00:00.000Z';

function createRepository(): NotificationPlatformWorkerRuntimeAnchorRepository & {
  saved: DurableNotificationPlatformWorkerRuntimeAnchor[];
} {
  const saved: DurableNotificationPlatformWorkerRuntimeAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformWorkerRuntimeAnchor>();

  return {
    saved,
    saveNotificationPlatformWorkerRuntimeAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.workerRuntimeAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformWorkerRuntimeAnchor: vi.fn(
      async (workspaceId, workerRuntimeAnchorId) =>
        byKey.get(`${workspaceId}:${workerRuntimeAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformWorkerRuntimeAnchors: vi.fn(async () => saved),
  };
}

describe('NotificationPlatformWorkerRuntimePersistenceService — W5-N11-b storage only', () => {
  it('persistWorkerRuntimeAnchor writes canonical platform worker runtime anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformWorkerRuntimePersistenceService(repository);

    const outcome = await service.persistWorkerRuntimeAnchor({
      workspaceId: 'ws-1',
      workerRuntimeAnchorId: 'worker-runtime-1',
      platformWorkerRuntimeType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      workerRuntimeAnchorId: 'worker-runtime-1',
      platformWorkerRuntimeType: 'cross-channel-foundation',
      workerRuntimeState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('worker-runtime-1');
    expect(await service.loadAnchor('ws-1', 'worker-runtime-1')).toMatchObject({
      workerRuntimeAnchorId: 'worker-runtime-1',
    });
  });

  it('does not persist runtime execution, scheduler, retry, dead-letter, orchestration, or transport fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformWorkerRuntimePersistenceService(repository);

    await service.persistWorkerRuntimeAnchor({
      workspaceId: 'ws-1',
      workerRuntimeAnchorId: 'worker-runtime-2',
      platformWorkerRuntimeType: 'platform-worker-runtime-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('runtimeExecutionState');
    expect(anchor).not.toHaveProperty('schedulerState');
    expect(anchor).not.toHaveProperty('retryState');
    expect(anchor).not.toHaveProperty('deadLetterState');
    expect(anchor).not.toHaveProperty('orchestrationState');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformWorkerRuntimeAnchor = {
      workspaceId: 'ws-1',
      workerRuntimeAnchorId: 'worker-runtime-3',
      platformWorkerRuntimeType: 'cross-channel-foundation',
      workerRuntimeState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformWorkerRuntimeAnchorState({
      workspaceId: 'ws-2',
      workerRuntimeAnchorId: 'worker-runtime-3',
      platformWorkerRuntimeType: 'cross-channel-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
