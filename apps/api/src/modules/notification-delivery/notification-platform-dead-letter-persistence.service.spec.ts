import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformDeadLetterAnchorState,
  type DurableNotificationPlatformDeadLetterAnchor,
} from './domain/durable-notification-platform-dead-letter-anchor';
import type { NotificationPlatformDeadLetterAnchorRepository } from './domain/notification-platform-dead-letter-anchor.repository';
import { NotificationPlatformDeadLetterPersistenceService } from './notification-platform-dead-letter-persistence.service';

const recordedAt = '2026-09-02T17:00:00.000Z';

function createRepository(): NotificationPlatformDeadLetterAnchorRepository & {
  saved: DurableNotificationPlatformDeadLetterAnchor[];
} {
  const saved: DurableNotificationPlatformDeadLetterAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformDeadLetterAnchor>();

  return {
    saved,
    saveNotificationPlatformDeadLetterAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.deadLetterAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformDeadLetterAnchor: vi.fn(
      async (workspaceId, deadLetterAnchorId) =>
        byKey.get(`${workspaceId}:${deadLetterAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformDeadLetterAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.deadLetterAnchorId.localeCompare(b.deadLetterAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformDeadLetterPersistenceService — W5-N14-b storage only', () => {
  it('persistDeadLetterAnchor writes canonical platform dead-letter anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformDeadLetterPersistenceService(repository);
    const outcome = await service.persistDeadLetterAnchor({
      workspaceId: 'ws-1',
      deadLetterAnchorId: 'dead-letter-1',
      platformDeadLetterType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      deadLetterAnchorId: 'dead-letter-1',
      platformDeadLetterType: 'cross-channel-foundation',
      deadLetterState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('dead-letter-1');
    expect(await service.loadAnchor('ws-1', 'dead-letter-1')).toMatchObject({
      deadLetterAnchorId: 'dead-letter-1',
    });
  });

  it('does not persist dead-letter runtime, replay, processing, retry, scheduler, workers, or transport fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformDeadLetterPersistenceService(repository);

    await service.persistDeadLetterAnchor({
      workspaceId: 'ws-1',
      deadLetterAnchorId: 'dead-letter-2',
      platformDeadLetterType: 'platform-dead-letter-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('deadLetterRuntimeState');
    expect(anchor).not.toHaveProperty('deadLetterReplayState');
    expect(anchor).not.toHaveProperty('deadLetterProcessingState');
    expect(anchor).not.toHaveProperty('retryExecutionState');
    expect(anchor).not.toHaveProperty('schedulerState');
    expect(anchor).not.toHaveProperty('workerState');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformDeadLetterAnchor = {
      workspaceId: 'ws-1',
      deadLetterAnchorId: 'dead-letter-3',
      platformDeadLetterType: 'cross-channel-foundation',
      deadLetterState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformDeadLetterAnchorState({
      workspaceId: 'ws-2',
      deadLetterAnchorId: 'dead-letter-3',
      platformDeadLetterType: 'cross-channel-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
