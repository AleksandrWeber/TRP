import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformRetryPolicyAnchorState,
  type DurableNotificationPlatformRetryPolicyAnchor,
} from './domain/durable-notification-platform-retry-policy-anchor';
import type { NotificationPlatformRetryPolicyAnchorRepository } from './domain/notification-platform-retry-policy-anchor.repository';
import { NotificationPlatformRetryPolicyRecoveryStore } from './domain/notification-platform-retry-policy-recovery-store';
import { NotificationPlatformRetryPolicyPersistenceService } from './notification-platform-retry-policy-persistence.service';

const recordedAt = '2026-09-12T21:00:00.000Z';

function createRepository(): NotificationPlatformRetryPolicyAnchorRepository & {
  saved: DurableNotificationPlatformRetryPolicyAnchor[];
} {
  const saved: DurableNotificationPlatformRetryPolicyAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformRetryPolicyAnchor>();

  return {
    saved,
    saveNotificationPlatformRetryPolicyAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.retryPolicyAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformRetryPolicyAnchor: vi.fn(
      async (workspaceId, retryPolicyAnchorId) =>
        byKey.get(`${workspaceId}:${retryPolicyAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformRetryPolicyAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.retryPolicyAnchorId.localeCompare(b.retryPolicyAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformRetryPolicyPersistenceService — W5-N20-b storage only', () => {
  it('persistNotificationPlatformRetryPolicyAnchor writes canonical platform retry policy anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetryPolicyPersistenceService(
      repository,
      new NotificationPlatformRetryPolicyRecoveryStore(),
    );
    const outcome = await service.persistNotificationPlatformRetryPolicyAnchor({
      workspaceId: 'ws-1',
      retryPolicyAnchorId: 'retry-policy-1',
      platformRetryPolicyType: 'policy-description-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      retryPolicyAnchorId: 'retry-policy-1',
      platformRetryPolicyType: 'policy-description-foundation',
      retryPolicyState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('retry-policy-1');
    expect(
      await service.loadNotificationPlatformRetryPolicyAnchor('ws-1', 'retry-policy-1'),
    ).toMatchObject({
      retryPolicyAnchorId: 'retry-policy-1',
    });
  });

  it('does not persist policy runtime, restart recovery, backoff, or transport fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetryPolicyPersistenceService(
      repository,
      new NotificationPlatformRetryPolicyRecoveryStore(),
    );

    await service.persistNotificationPlatformRetryPolicyAnchor({
      workspaceId: 'ws-1',
      retryPolicyAnchorId: 'retry-policy-2',
      platformRetryPolicyType: 'platform-retry-policy-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('retryPolicyEvaluationState');
    expect(anchor).not.toHaveProperty('restartRecoveryState');
    expect(anchor).not.toHaveProperty('backoffState');
    expect(anchor).not.toHaveProperty('nextRetryAt');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformRetryPolicyAnchor = {
      workspaceId: 'ws-1',
      retryPolicyAnchorId: 'retry-policy-3',
      platformRetryPolicyType: 'policy-description-foundation',
      retryPolicyState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformRetryPolicyAnchorState({
      workspaceId: 'ws-2',
      retryPolicyAnchorId: 'retry-policy-3',
      platformRetryPolicyType: 'policy-description-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
