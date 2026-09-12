import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformRetryEligibilityAnchorState,
  type DurableNotificationPlatformRetryEligibilityAnchor,
} from './domain/durable-notification-platform-retry-eligibility-anchor';
import type { NotificationPlatformRetryEligibilityAnchorRepository } from './domain/notification-platform-retry-eligibility-anchor.repository';
import { NotificationPlatformRetryEligibilityRecoveryStore } from './domain/notification-platform-retry-eligibility-recovery-store';
import { NotificationPlatformRetryEligibilityPersistenceService } from './notification-platform-retry-eligibility-persistence.service';

const recordedAt = '2026-09-12T21:00:00.000Z';

function createRepository(): NotificationPlatformRetryEligibilityAnchorRepository & {
  saved: DurableNotificationPlatformRetryEligibilityAnchor[];
} {
  const saved: DurableNotificationPlatformRetryEligibilityAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformRetryEligibilityAnchor>();

  return {
    saved,
    saveNotificationPlatformRetryEligibilityAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.eligibilityAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformRetryEligibilityAnchor: vi.fn(
      async (workspaceId, eligibilityAnchorId) =>
        byKey.get(`${workspaceId}:${eligibilityAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformRetryEligibilityAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.eligibilityAnchorId.localeCompare(b.eligibilityAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformRetryEligibilityPersistenceService — W5-N23-b storage only', () => {
  it('persistNotificationPlatformRetryEligibilityAnchor writes canonical eligibility anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetryEligibilityPersistenceService(
      repository,
      new NotificationPlatformRetryEligibilityRecoveryStore(),
    );
    const outcome = await service.persistNotificationPlatformRetryEligibilityAnchor({
      workspaceId: 'ws-1',
      eligibilityAnchorId: 'eligibility-anchor-1',
      platformRetryEligibilityType: 'eligibility-description-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      eligibilityAnchorId: 'eligibility-anchor-1',
      platformRetryEligibilityType: 'eligibility-description-foundation',
      eligibilityAnchorState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('eligibility-anchor-1');
    expect(
      await service.loadNotificationPlatformRetryEligibilityAnchor('ws-1', 'eligibility-anchor-1'),
    ).toMatchObject({
      eligibilityAnchorId: 'eligibility-anchor-1',
    });
  });

  it('does not persist eligibility evaluation, schedule, execution, or recovery fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetryEligibilityPersistenceService(
      repository,
      new NotificationPlatformRetryEligibilityRecoveryStore(),
    );

    await service.persistNotificationPlatformRetryEligibilityAnchor({
      workspaceId: 'ws-1',
      eligibilityAnchorId: 'eligibility-anchor-2',
      platformRetryEligibilityType: 'platform-retry-eligibility-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('eligibilityEvaluationRuntime');
    expect(anchor).not.toHaveProperty('eligibilityEngineState');
    expect(anchor).not.toHaveProperty('restartRecoveryState');
    expect(anchor).not.toHaveProperty('nextRetryAt');
    expect(anchor).not.toHaveProperty('scheduledAt');
    expect(anchor).not.toHaveProperty('scheduleState');
    expect(anchor).not.toHaveProperty('executionState');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformRetryEligibilityAnchor = {
      workspaceId: 'ws-1',
      eligibilityAnchorId: 'eligibility-anchor-3',
      platformRetryEligibilityType: 'eligibility-description-foundation',
      eligibilityAnchorState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformRetryEligibilityAnchorState({
      workspaceId: 'ws-2',
      eligibilityAnchorId: 'eligibility-anchor-3',
      platformRetryEligibilityType: 'eligibility-description-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
