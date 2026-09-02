import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformRetryAnchorState,
  type DurableNotificationPlatformRetryAnchor,
} from './domain/durable-notification-platform-retry-anchor';
import type { NotificationPlatformRetryAnchorRepository } from './domain/notification-platform-retry-anchor.repository';
import { NotificationPlatformRetryRecoveryStore } from './domain/notification-platform-retry-recovery-store';
import { NotificationPlatformRetryPersistenceService } from './notification-platform-retry-persistence.service';

const recordedAt = '2026-09-02T16:00:00.000Z';

function createRepository(): NotificationPlatformRetryAnchorRepository & {
  saved: DurableNotificationPlatformRetryAnchor[];
} {
  const saved: DurableNotificationPlatformRetryAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformRetryAnchor>();

  return {
    saved,
    saveNotificationPlatformRetryAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.retryAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformRetryAnchor: vi.fn(
      async (workspaceId, retryAnchorId) => byKey.get(`${workspaceId}:${retryAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformRetryAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.retryAnchorId.localeCompare(b.retryAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformRetryPersistenceService — W5-N13-b storage only', () => {
  it('persistRetryAnchor writes canonical platform retry anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetryPersistenceService(
      repository,
      new NotificationPlatformRetryRecoveryStore(),
    );
    const outcome = await service.persistRetryAnchor({
      workspaceId: 'ws-1',
      retryAnchorId: 'retry-1',
      platformRetryType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      retryAnchorId: 'retry-1',
      platformRetryType: 'cross-channel-foundation',
      retryState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('retry-1');
    expect(await service.loadAnchor('ws-1', 'retry-1')).toMatchObject({
      retryAnchorId: 'retry-1',
    });
  });

  it('does not persist retry runtime, scheduling, execution, dead-letter, orchestration, or transport fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetryPersistenceService(
      repository,
      new NotificationPlatformRetryRecoveryStore(),
    );

    await service.persistRetryAnchor({
      workspaceId: 'ws-1',
      retryAnchorId: 'retry-2',
      platformRetryType: 'platform-retry-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('retryRuntimeState');
    expect(anchor).not.toHaveProperty('retrySchedulingState');
    expect(anchor).not.toHaveProperty('retryExecutionState');
    expect(anchor).not.toHaveProperty('deadLetterState');
    expect(anchor).not.toHaveProperty('orchestrationState');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformRetryAnchor = {
      workspaceId: 'ws-1',
      retryAnchorId: 'retry-3',
      platformRetryType: 'cross-channel-foundation',
      retryState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformRetryAnchorState({
      workspaceId: 'ws-2',
      retryAnchorId: 'retry-3',
      platformRetryType: 'cross-channel-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
