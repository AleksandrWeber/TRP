import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformSchedulerAnchorState,
  type DurableNotificationPlatformSchedulerAnchor,
} from './domain/durable-notification-platform-scheduler-anchor';
import type { NotificationPlatformSchedulerAnchorRepository } from './domain/notification-platform-scheduler-anchor.repository';
import { NotificationPlatformSchedulerRecoveryStore } from './domain/notification-platform-scheduler-recovery-store';
import { NotificationPlatformSchedulerPersistenceService } from './notification-platform-scheduler-persistence.service';

const recordedAt = '2026-09-02T14:00:00.000Z';

function createRepository(): NotificationPlatformSchedulerAnchorRepository & {
  saved: DurableNotificationPlatformSchedulerAnchor[];
} {
  const saved: DurableNotificationPlatformSchedulerAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformSchedulerAnchor>();

  return {
    saved,
    saveNotificationPlatformSchedulerAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.schedulerAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformSchedulerAnchor: vi.fn(
      async (workspaceId, schedulerAnchorId) =>
        byKey.get(`${workspaceId}:${schedulerAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformSchedulerAnchors: vi.fn(async () => saved),
  };
}

describe('NotificationPlatformSchedulerPersistenceService — W5-N12-b storage only', () => {
  it('persistSchedulerAnchor writes canonical platform scheduler anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformSchedulerPersistenceService(
      repository,
      new NotificationPlatformSchedulerRecoveryStore(),
    );
    const outcome = await service.persistSchedulerAnchor({
      workspaceId: 'ws-1',
      schedulerAnchorId: 'scheduler-1',
      platformSchedulerType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      schedulerAnchorId: 'scheduler-1',
      platformSchedulerType: 'cross-channel-foundation',
      schedulerState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('scheduler-1');
    expect(await service.loadAnchor('ws-1', 'scheduler-1')).toMatchObject({
      schedulerAnchorId: 'scheduler-1',
    });
  });

  it('does not persist scheduler runtime, execution loop, retry, dead-letter, orchestration, or transport fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformSchedulerPersistenceService(
      repository,
      new NotificationPlatformSchedulerRecoveryStore(),
    );

    await service.persistSchedulerAnchor({
      workspaceId: 'ws-1',
      schedulerAnchorId: 'scheduler-2',
      platformSchedulerType: 'platform-scheduler-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('schedulerRuntimeState');
    expect(anchor).not.toHaveProperty('executionLoopState');
    expect(anchor).not.toHaveProperty('retryState');
    expect(anchor).not.toHaveProperty('deadLetterState');
    expect(anchor).not.toHaveProperty('orchestrationState');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformSchedulerAnchor = {
      workspaceId: 'ws-1',
      schedulerAnchorId: 'scheduler-3',
      platformSchedulerType: 'cross-channel-foundation',
      schedulerState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformSchedulerAnchorState({
      workspaceId: 'ws-2',
      schedulerAnchorId: 'scheduler-3',
      platformSchedulerType: 'cross-channel-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
