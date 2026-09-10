import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformRetrySchedulingAnchorState,
  type DurableNotificationPlatformRetrySchedulingAnchor,
} from './domain/durable-notification-platform-retry-scheduling-anchor';
import type { NotificationPlatformRetrySchedulingAnchorRepository } from './domain/notification-platform-retry-scheduling-anchor.repository';
import { NotificationPlatformRetrySchedulingRecoveryStore } from './domain/notification-platform-retry-scheduling-recovery-store';
import { NotificationPlatformRetrySchedulingPersistenceService } from './notification-platform-retry-scheduling-persistence.service';

const recordedAt = '2026-09-10T21:00:00.000Z';

function createRepository(): NotificationPlatformRetrySchedulingAnchorRepository & {
  saved: DurableNotificationPlatformRetrySchedulingAnchor[];
} {
  const saved: DurableNotificationPlatformRetrySchedulingAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformRetrySchedulingAnchor>();

  return {
    saved,
    saveNotificationPlatformRetrySchedulingAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.retrySchedulingAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformRetrySchedulingAnchor: vi.fn(
      async (workspaceId, retrySchedulingAnchorId) =>
        byKey.get(`${workspaceId}:${retrySchedulingAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformRetrySchedulingAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.retrySchedulingAnchorId.localeCompare(b.retrySchedulingAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformRetrySchedulingPersistenceService — W5-N19-b storage only', () => {
  it('persistNotificationPlatformRetrySchedulingAnchor writes canonical platform retry scheduling anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetrySchedulingPersistenceService(
      repository,
      new NotificationPlatformRetrySchedulingRecoveryStore(),
    );
    const outcome = await service.persistNotificationPlatformRetrySchedulingAnchor({
      workspaceId: 'ws-1',
      retrySchedulingAnchorId: 'retry-scheduling-1',
      platformRetrySchedulingType: 'eligibility-timing-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      retrySchedulingAnchorId: 'retry-scheduling-1',
      platformRetrySchedulingType: 'eligibility-timing-foundation',
      retrySchedulingState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('retry-scheduling-1');
    expect(
      await service.loadNotificationPlatformRetrySchedulingAnchor('ws-1', 'retry-scheduling-1'),
    ).toMatchObject({
      retrySchedulingAnchorId: 'retry-scheduling-1',
    });
  });

  it('does not persist scheduling runtime, restart recovery, timing, or transport fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetrySchedulingPersistenceService(
      repository,
      new NotificationPlatformRetrySchedulingRecoveryStore(),
    );

    await service.persistNotificationPlatformRetrySchedulingAnchor({
      workspaceId: 'ws-1',
      retrySchedulingAnchorId: 'retry-scheduling-2',
      platformRetrySchedulingType: 'platform-retry-scheduling-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('retrySchedulingRuntimeState');
    expect(anchor).not.toHaveProperty('restartRecoveryState');
    expect(anchor).not.toHaveProperty('backoffState');
    expect(anchor).not.toHaveProperty('nextRetryAt');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformRetrySchedulingAnchor = {
      workspaceId: 'ws-1',
      retrySchedulingAnchorId: 'retry-scheduling-3',
      platformRetrySchedulingType: 'eligibility-timing-foundation',
      retrySchedulingState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformRetrySchedulingAnchorState({
      workspaceId: 'ws-2',
      retrySchedulingAnchorId: 'retry-scheduling-3',
      platformRetrySchedulingType: 'eligibility-timing-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
