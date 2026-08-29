import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformWorkerExecutionAnchorState,
  type DurableNotificationPlatformWorkerExecutionAnchor,
} from './domain/durable-notification-platform-worker-execution-anchor';
import type { NotificationPlatformWorkerExecutionAnchorRepository } from './domain/notification-platform-worker-execution-anchor.repository';
import { NotificationPlatformWorkerExecutionPersistenceService } from './notification-platform-worker-execution-persistence.service';

const recordedAt = '2026-08-29T22:00:00.000Z';

function createRepository(): NotificationPlatformWorkerExecutionAnchorRepository & {
  saved: DurableNotificationPlatformWorkerExecutionAnchor[];
} {
  const saved: DurableNotificationPlatformWorkerExecutionAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformWorkerExecutionAnchor>();

  return {
    saved,
    saveNotificationPlatformWorkerExecutionAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.workerExecutionAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformWorkerExecutionAnchor: vi.fn(
      async (workspaceId, workerExecutionAnchorId) =>
        byKey.get(`${workspaceId}:${workerExecutionAnchorId}`) ?? null,
    ),
  };
}

describe('NotificationPlatformWorkerExecutionPersistenceService — W5-N10-b storage only', () => {
  it('persistWorkerExecutionAnchor writes canonical platform worker execution anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformWorkerExecutionPersistenceService(repository);

    const outcome = await service.persistWorkerExecutionAnchor({
      workspaceId: 'ws-1',
      workerExecutionAnchorId: 'worker-exec-1',
      platformWorkerExecutionType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      workerExecutionAnchorId: 'worker-exec-1',
      platformWorkerExecutionType: 'cross-channel-foundation',
      workerExecutionState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('worker-exec-1');
    expect(await service.loadAnchor('ws-1', 'worker-exec-1')).toMatchObject({
      workerExecutionAnchorId: 'worker-exec-1',
    });
  });

  it('does not persist worker runtime, scheduler, retry, dead-letter, orchestration, or transport fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformWorkerExecutionPersistenceService(repository);

    await service.persistWorkerExecutionAnchor({
      workspaceId: 'ws-1',
      workerExecutionAnchorId: 'worker-exec-2',
      platformWorkerExecutionType: 'platform-worker-execution-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('workerRuntimeState');
    expect(anchor).not.toHaveProperty('schedulerState');
    expect(anchor).not.toHaveProperty('retryState');
    expect(anchor).not.toHaveProperty('deadLetterState');
    expect(anchor).not.toHaveProperty('orchestrationState');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformWorkerExecutionAnchor = {
      workspaceId: 'ws-1',
      workerExecutionAnchorId: 'worker-exec-3',
      platformWorkerExecutionType: 'cross-channel-foundation',
      workerExecutionState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformWorkerExecutionAnchorState({
      workspaceId: 'ws-2',
      workerExecutionAnchorId: 'worker-exec-3',
      platformWorkerExecutionType: 'cross-channel-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
