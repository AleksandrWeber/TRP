import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformRetrySchedulingDecisionProjectionAnchorState,
  type DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor,
} from './domain/durable-notification-platform-retry-scheduling-decision-projection-anchor';
import type { NotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository } from './domain/notification-platform-retry-scheduling-decision-projection-anchor.repository';
import { NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore } from './domain/notification-platform-retry-scheduling-decision-projection-recovery-store';
import { NotificationPlatformRetrySchedulingDecisionProjectionPersistenceService } from './notification-platform-retry-scheduling-decision-projection-persistence.service';

const recordedAt = '2026-09-13T17:00:00.000Z';

function createRepository(): NotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository & {
  saved: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[];
} {
  const saved: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[] = [];
  const byKey = new Map<
    string,
    DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor
  >();

  return {
    saved,
    saveNotificationPlatformRetrySchedulingDecisionProjectionAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.projectionAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformRetrySchedulingDecisionProjectionAnchor: vi.fn(
      async (workspaceId, projectionAnchorId) =>
        byKey.get(`${workspaceId}:${projectionAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformRetrySchedulingDecisionProjectionAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.projectionAnchorId.localeCompare(b.projectionAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformRetrySchedulingDecisionProjectionPersistenceService — W5-N27-b storage only', () => {
  it('persistNotificationPlatformRetrySchedulingDecisionProjectionAnchor writes canonical decision anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetrySchedulingDecisionProjectionPersistenceService(
      repository,
      new NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore(),
    );
    const outcome =
      await service.persistNotificationPlatformRetrySchedulingDecisionProjectionAnchor({
        workspaceId: 'ws-1',
        projectionAnchorId: 'projection-anchor-1',
        platformRetrySchedulingDecisionProjectionType: 'decision-projection-description-foundation',
        channelScope: 'telegram,email,slack-discord-teams,push',
        correlationId: 'corr-1',
        actorId: 'actor-1',
        recordedAt,
      });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      projectionAnchorId: 'projection-anchor-1',
      platformRetrySchedulingDecisionProjectionType: 'decision-projection-description-foundation',
      projectionAnchorState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('projection-anchor-1');
    expect(
      await service.loadNotificationPlatformRetrySchedulingDecisionProjectionAnchor(
        'ws-1',
        'projection-anchor-1',
      ),
    ).toMatchObject({
      projectionAnchorId: 'projection-anchor-1',
    });
  });

  it('does not persist decision runtime, schedule, execution, or recovery fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetrySchedulingDecisionProjectionPersistenceService(
      repository,
      new NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore(),
    );

    await service.persistNotificationPlatformRetrySchedulingDecisionProjectionAnchor({
      workspaceId: 'ws-1',
      projectionAnchorId: 'projection-anchor-2',
      platformRetrySchedulingDecisionProjectionType:
        'platform-retry-scheduling-decision-projection-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('decisionRuntime');
    expect(anchor).not.toHaveProperty('runtimeDecisionProjection');
    expect(anchor).not.toHaveProperty('restartRecoveryState');
    expect(anchor).not.toHaveProperty('nextRetryAt');
    expect(anchor).not.toHaveProperty('scheduledAt');
    expect(anchor).not.toHaveProperty('scheduleState');
    expect(anchor).not.toHaveProperty('executionState');
    expect(anchor).not.toHaveProperty('eligibilityProjectionRuntime');
    expect(anchor).not.toHaveProperty('backoffCalculationRuntime');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor = {
      workspaceId: 'ws-1',
      projectionAnchorId: 'projection-anchor-3',
      platformRetrySchedulingDecisionProjectionType: 'decision-projection-description-foundation',
      projectionAnchorState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformRetrySchedulingDecisionProjectionAnchorState({
      workspaceId: 'ws-2',
      projectionAnchorId: 'projection-anchor-3',
      platformRetrySchedulingDecisionProjectionType: 'decision-projection-description-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
