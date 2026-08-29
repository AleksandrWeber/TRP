import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformWorkersAnchorState,
  type DurableNotificationPlatformWorkersAnchor,
} from './domain/durable-notification-platform-workers-anchor';
import type { NotificationPlatformWorkersAnchorRepository } from './domain/notification-platform-workers-anchor.repository';
import { NotificationPlatformWorkersPersistenceService } from './notification-platform-workers-persistence.service';
import { NotificationPlatformWorkersRecoveryStore } from './notification-platform-workers-recovery-store';

const recordedAt = '2026-08-29T21:00:00.000Z';

function createRepository(): NotificationPlatformWorkersAnchorRepository & {
  saved: DurableNotificationPlatformWorkersAnchor[];
} {
  const saved: DurableNotificationPlatformWorkersAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformWorkersAnchor>();

  return {
    saved,
    saveNotificationPlatformWorkersAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.workersAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformWorkersAnchor: vi.fn(
      async (workspaceId, workersAnchorId) =>
        byKey.get(`${workspaceId}:${workersAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformWorkersAnchors: vi.fn(async () => saved),
  };
}

describe('NotificationPlatformWorkersPersistenceService — W5-N09-b/c storage only', () => {
  it('persistWorkersAnchor writes canonical platform workers anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformWorkersPersistenceService(
      repository,
      new NotificationPlatformWorkersRecoveryStore(),
    );

    const outcome = await service.persistWorkersAnchor({
      workspaceId: 'ws-1',
      workersAnchorId: 'workers-1',
      platformWorkerType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      workersAnchorId: 'workers-1',
      platformWorkerType: 'cross-channel-foundation',
      workersState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('workers-1');
    expect(await service.loadAnchor('ws-1', 'workers-1')).toMatchObject({
      workersAnchorId: 'workers-1',
    });
  });

  it('does not persist worker execution, scheduler, retry, dead-letter, orchestration, or transport fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformWorkersPersistenceService(
      repository,
      new NotificationPlatformWorkersRecoveryStore(),
    );

    await service.persistWorkersAnchor({
      workspaceId: 'ws-1',
      workersAnchorId: 'workers-2',
      platformWorkerType: 'platform-workers-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('workerExecutionState');
    expect(anchor).not.toHaveProperty('schedulerState');
    expect(anchor).not.toHaveProperty('retryState');
    expect(anchor).not.toHaveProperty('deadLetterState');
    expect(anchor).not.toHaveProperty('orchestrationState');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformWorkersAnchor = {
      workspaceId: 'ws-1',
      workersAnchorId: 'workers-3',
      platformWorkerType: 'cross-channel-foundation',
      workersState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformWorkersAnchorState({
      workspaceId: 'ws-2',
      workersAnchorId: 'workers-3',
      platformWorkerType: 'cross-channel-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
