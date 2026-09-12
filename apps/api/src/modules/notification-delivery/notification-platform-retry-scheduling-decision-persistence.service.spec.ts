import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformRetrySchedulingDecisionAnchorState,
  type DurableNotificationPlatformRetrySchedulingDecisionAnchor,
} from './domain/durable-notification-platform-retry-scheduling-decision-anchor';
import type { NotificationPlatformRetrySchedulingDecisionAnchorRepository } from './domain/notification-platform-retry-scheduling-decision-anchor.repository';
import { NotificationPlatformRetrySchedulingDecisionRecoveryStore } from './domain/notification-platform-retry-scheduling-decision-recovery-store';
import { NotificationPlatformRetrySchedulingDecisionPersistenceService } from './notification-platform-retry-scheduling-decision-persistence.service';

const recordedAt = '2026-09-12T21:00:00.000Z';

function createRepository(): NotificationPlatformRetrySchedulingDecisionAnchorRepository & {
  saved: DurableNotificationPlatformRetrySchedulingDecisionAnchor[];
} {
  const saved: DurableNotificationPlatformRetrySchedulingDecisionAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformRetrySchedulingDecisionAnchor>();

  return {
    saved,
    saveNotificationPlatformRetrySchedulingDecisionAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.decisionAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformRetrySchedulingDecisionAnchor: vi.fn(
      async (workspaceId, decisionAnchorId) =>
        byKey.get(`${workspaceId}:${decisionAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformRetrySchedulingDecisionAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.decisionAnchorId.localeCompare(b.decisionAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformRetrySchedulingDecisionPersistenceService — W5-N25-b storage only', () => {
  it('persistNotificationPlatformRetrySchedulingDecisionAnchor writes canonical decision anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetrySchedulingDecisionPersistenceService(
      repository,
      new NotificationPlatformRetrySchedulingDecisionRecoveryStore(),
    );
    const outcome = await service.persistNotificationPlatformRetrySchedulingDecisionAnchor({
      workspaceId: 'ws-1',
      decisionAnchorId: 'decision-anchor-1',
      platformRetrySchedulingDecisionType: 'decision-description-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      decisionAnchorId: 'decision-anchor-1',
      platformRetrySchedulingDecisionType: 'decision-description-foundation',
      decisionAnchorState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('decision-anchor-1');
    expect(
      await service.loadNotificationPlatformRetrySchedulingDecisionAnchor(
        'ws-1',
        'decision-anchor-1',
      ),
    ).toMatchObject({
      decisionAnchorId: 'decision-anchor-1',
    });
  });

  it('does not persist decision runtime, schedule, execution, or recovery fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetrySchedulingDecisionPersistenceService(
      repository,
      new NotificationPlatformRetrySchedulingDecisionRecoveryStore(),
    );

    await service.persistNotificationPlatformRetrySchedulingDecisionAnchor({
      workspaceId: 'ws-1',
      decisionAnchorId: 'decision-anchor-2',
      platformRetrySchedulingDecisionType: 'platform-retry-scheduling-decision-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('decisionRuntime');
    expect(anchor).not.toHaveProperty('runtimeDecisionLogic');
    expect(anchor).not.toHaveProperty('restartRecoveryState');
    expect(anchor).not.toHaveProperty('nextRetryAt');
    expect(anchor).not.toHaveProperty('scheduledAt');
    expect(anchor).not.toHaveProperty('scheduleState');
    expect(anchor).not.toHaveProperty('executionState');
    expect(anchor).not.toHaveProperty('eligibilityEvaluationRuntime');
    expect(anchor).not.toHaveProperty('backoffCalculationRuntime');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformRetrySchedulingDecisionAnchor = {
      workspaceId: 'ws-1',
      decisionAnchorId: 'decision-anchor-3',
      platformRetrySchedulingDecisionType: 'decision-description-foundation',
      decisionAnchorState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformRetrySchedulingDecisionAnchorState({
      workspaceId: 'ws-2',
      decisionAnchorId: 'decision-anchor-3',
      platformRetrySchedulingDecisionType: 'decision-description-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
