import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformRetrySchedulingDecisionEvaluationAnchorState,
  type DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor,
} from './domain/durable-notification-platform-retry-scheduling-decision-evaluation-anchor';
import type { NotificationPlatformRetrySchedulingDecisionEvaluationAnchorRepository } from './domain/notification-platform-retry-scheduling-decision-evaluation-anchor.repository';
import { NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStore } from './domain/notification-platform-retry-scheduling-decision-evaluation-recovery-store';
import { NotificationPlatformRetrySchedulingDecisionEvaluationPersistenceService } from './notification-platform-retry-scheduling-decision-evaluation-persistence.service';

const recordedAt = '2026-09-13T17:00:00.000Z';

function createRepository(): NotificationPlatformRetrySchedulingDecisionEvaluationAnchorRepository & {
  saved: DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[];
} {
  const saved: DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[] = [];
  const byKey = new Map<
    string,
    DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor
  >();

  return {
    saved,
    saveNotificationPlatformRetrySchedulingDecisionEvaluationAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.evaluationAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformRetrySchedulingDecisionEvaluationAnchor: vi.fn(
      async (workspaceId, evaluationAnchorId) =>
        byKey.get(`${workspaceId}:${evaluationAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformRetrySchedulingDecisionEvaluationAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.evaluationAnchorId.localeCompare(b.evaluationAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformRetrySchedulingDecisionEvaluationPersistenceService — W5-N26-b storage only', () => {
  it('persistNotificationPlatformRetrySchedulingDecisionEvaluationAnchor writes canonical decision anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetrySchedulingDecisionEvaluationPersistenceService(
      repository,
      new NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStore(),
    );
    const outcome =
      await service.persistNotificationPlatformRetrySchedulingDecisionEvaluationAnchor({
        workspaceId: 'ws-1',
        evaluationAnchorId: 'evaluation-anchor-1',
        platformRetrySchedulingDecisionEvaluationType: 'decision-evaluation-description-foundation',
        channelScope: 'telegram,email,slack-discord-teams,push',
        correlationId: 'corr-1',
        actorId: 'actor-1',
        recordedAt,
      });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      evaluationAnchorId: 'evaluation-anchor-1',
      platformRetrySchedulingDecisionEvaluationType: 'decision-evaluation-description-foundation',
      evaluationAnchorState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('evaluation-anchor-1');
    expect(
      await service.loadNotificationPlatformRetrySchedulingDecisionEvaluationAnchor(
        'ws-1',
        'evaluation-anchor-1',
      ),
    ).toMatchObject({
      evaluationAnchorId: 'evaluation-anchor-1',
    });
  });

  it('does not persist decision runtime, schedule, execution, or recovery fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetrySchedulingDecisionEvaluationPersistenceService(
      repository,
      new NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStore(),
    );

    await service.persistNotificationPlatformRetrySchedulingDecisionEvaluationAnchor({
      workspaceId: 'ws-1',
      evaluationAnchorId: 'evaluation-anchor-2',
      platformRetrySchedulingDecisionEvaluationType:
        'platform-retry-scheduling-decision-evaluation-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('decisionRuntime');
    expect(anchor).not.toHaveProperty('runtimeDecisionEvaluation');
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
    const prior: DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor = {
      workspaceId: 'ws-1',
      evaluationAnchorId: 'evaluation-anchor-3',
      platformRetrySchedulingDecisionEvaluationType: 'decision-evaluation-description-foundation',
      evaluationAnchorState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformRetrySchedulingDecisionEvaluationAnchorState({
      workspaceId: 'ws-2',
      evaluationAnchorId: 'evaluation-anchor-3',
      platformRetrySchedulingDecisionEvaluationType: 'decision-evaluation-description-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
