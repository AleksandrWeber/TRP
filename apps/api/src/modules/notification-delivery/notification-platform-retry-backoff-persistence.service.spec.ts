import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformRetryBackoffAnchorState,
  type DurableNotificationPlatformRetryBackoffAnchor,
} from './domain/durable-notification-platform-retry-backoff-anchor';
import type { NotificationPlatformRetryBackoffAnchorRepository } from './domain/notification-platform-retry-backoff-anchor.repository';
import { NotificationPlatformRetryBackoffRecoveryStore } from './domain/notification-platform-retry-backoff-recovery-store';
import { NotificationPlatformRetryBackoffPersistenceService } from './notification-platform-retry-backoff-persistence.service';

const recordedAt = '2026-09-12T21:00:00.000Z';

function createRepository(): NotificationPlatformRetryBackoffAnchorRepository & {
  saved: DurableNotificationPlatformRetryBackoffAnchor[];
} {
  const saved: DurableNotificationPlatformRetryBackoffAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformRetryBackoffAnchor>();

  return {
    saved,
    saveNotificationPlatformRetryBackoffAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.retryBackoffAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformRetryBackoffAnchor: vi.fn(
      async (workspaceId, retryBackoffAnchorId) =>
        byKey.get(`${workspaceId}:${retryBackoffAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformRetryBackoffAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.retryBackoffAnchorId.localeCompare(b.retryBackoffAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformRetryBackoffPersistenceService — W5-N21-b storage only', () => {
  it('persistNotificationPlatformRetryBackoffAnchor writes canonical platform retry backoff anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetryBackoffPersistenceService(
      repository,
      new NotificationPlatformRetryBackoffRecoveryStore(),
    );
    const outcome = await service.persistNotificationPlatformRetryBackoffAnchor({
      workspaceId: 'ws-1',
      retryBackoffAnchorId: 'retry-backoff-1',
      platformRetryBackoffType: 'backoff-description-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      retryBackoffAnchorId: 'retry-backoff-1',
      platformRetryBackoffType: 'backoff-description-foundation',
      retryBackoffState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('retry-backoff-1');
    expect(
      await service.loadNotificationPlatformRetryBackoffAnchor('ws-1', 'retry-backoff-1'),
    ).toMatchObject({
      retryBackoffAnchorId: 'retry-backoff-1',
    });
  });

  it('does not persist backoff runtime, restart recovery, policy evaluation, or transport fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetryBackoffPersistenceService(
      repository,
      new NotificationPlatformRetryBackoffRecoveryStore(),
    );

    await service.persistNotificationPlatformRetryBackoffAnchor({
      workspaceId: 'ws-1',
      retryBackoffAnchorId: 'retry-backoff-2',
      platformRetryBackoffType: 'platform-retry-backoff-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('backoffCalculationState');
    expect(anchor).not.toHaveProperty('restartRecoveryState');
    expect(anchor).not.toHaveProperty('retryPolicyEvaluationState');
    expect(anchor).not.toHaveProperty('nextRetryAt');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformRetryBackoffAnchor = {
      workspaceId: 'ws-1',
      retryBackoffAnchorId: 'retry-backoff-3',
      platformRetryBackoffType: 'backoff-description-foundation',
      retryBackoffState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformRetryBackoffAnchorState({
      workspaceId: 'ws-2',
      retryBackoffAnchorId: 'retry-backoff-3',
      platformRetryBackoffType: 'backoff-description-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
