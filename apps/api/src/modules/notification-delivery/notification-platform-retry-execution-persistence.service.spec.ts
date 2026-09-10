import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformRetryExecutionAnchorState,
  type DurableNotificationPlatformRetryExecutionAnchor,
} from './domain/durable-notification-platform-retry-execution-anchor';
import type { NotificationPlatformRetryExecutionAnchorRepository } from './domain/notification-platform-retry-execution-anchor.repository';
import { NotificationPlatformRetryExecutionRecoveryStore } from './domain/notification-platform-retry-execution-recovery-store';
import { NotificationPlatformRetryExecutionPersistenceService } from './notification-platform-retry-execution-persistence.service';

const recordedAt = '2026-09-10T19:00:00.000Z';

function createRepository(): NotificationPlatformRetryExecutionAnchorRepository & {
  saved: DurableNotificationPlatformRetryExecutionAnchor[];
} {
  const saved: DurableNotificationPlatformRetryExecutionAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformRetryExecutionAnchor>();

  return {
    saved,
    saveNotificationPlatformRetryExecutionAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.retryExecutionAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformRetryExecutionAnchor: vi.fn(
      async (workspaceId, retryExecutionAnchorId) =>
        byKey.get(`${workspaceId}:${retryExecutionAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformRetryExecutionAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.retryExecutionAnchorId.localeCompare(b.retryExecutionAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformRetryExecutionPersistenceService — W5-N18-b storage only', () => {
  it('persistNotificationPlatformRetryExecutionAnchor writes canonical platform retry execution anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetryExecutionPersistenceService(
      repository,
      new NotificationPlatformRetryExecutionRecoveryStore(),
    );
    const outcome = await service.persistNotificationPlatformRetryExecutionAnchor({
      workspaceId: 'ws-1',
      retryExecutionAnchorId: 'retry-execution-1',
      platformRetryExecutionType: 'eligibility-sequencing-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      retryExecutionAnchorId: 'retry-execution-1',
      platformRetryExecutionType: 'eligibility-sequencing-foundation',
      retryExecutionState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('retry-execution-1');
    expect(
      await service.loadNotificationPlatformRetryExecutionAnchor('ws-1', 'retry-execution-1'),
    ).toMatchObject({
      retryExecutionAnchorId: 'retry-execution-1',
    });
  });

  it('does not persist delivery execution, restart recovery, reliability, or transport fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetryExecutionPersistenceService(
      repository,
      new NotificationPlatformRetryExecutionRecoveryStore(),
    );

    await service.persistNotificationPlatformRetryExecutionAnchor({
      workspaceId: 'ws-1',
      retryExecutionAnchorId: 'retry-execution-2',
      platformRetryExecutionType: 'platform-retry-execution-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('deliveryExecutionState');
    expect(anchor).not.toHaveProperty('restartRecoveryState');
    expect(anchor).not.toHaveProperty('reliabilityState');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformRetryExecutionAnchor = {
      workspaceId: 'ws-1',
      retryExecutionAnchorId: 'retry-execution-3',
      platformRetryExecutionType: 'eligibility-sequencing-foundation',
      retryExecutionState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformRetryExecutionAnchorState({
      workspaceId: 'ws-2',
      retryExecutionAnchorId: 'retry-execution-3',
      platformRetryExecutionType: 'eligibility-sequencing-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
