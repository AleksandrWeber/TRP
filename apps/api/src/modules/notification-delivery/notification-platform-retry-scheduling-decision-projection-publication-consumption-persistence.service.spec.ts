import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState,
  type DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor,
} from './domain/durable-notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor';
import type { NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRepository } from './domain/notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor.repository';
import { NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStore } from './domain/notification-platform-retry-scheduling-decision-projection-publication-consumption-recovery-store';
import { NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionPersistenceService } from './notification-platform-retry-scheduling-decision-projection-publication-consumption-persistence.service';

const recordedAt = '2026-09-14T08:00:00.000Z';

function createRepository(): NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRepository & {
  saved: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[];
} {
  const saved: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[] =
    [];
  const byKey = new Map<
    string,
    DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor
  >();

  return {
    saved,
    saveNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor: vi.fn(
      async (anchor) => {
        byKey.set(`${anchor.workspaceId}:${anchor.consumptionAnchorId}`, anchor);
        saved.push(anchor);
      },
    ),
    loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor: vi.fn(
      async (workspaceId, consumptionAnchorId) =>
        byKey.get(`${workspaceId}:${consumptionAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchors:
      vi.fn(async () =>
        [...byKey.values()].sort((a, b) => {
          const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
          if (workspaceCompare !== 0) {
            return workspaceCompare;
          }
          return a.consumptionAnchorId.localeCompare(b.consumptionAnchorId);
        }),
      ),
  };
}

describe('NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionPersistenceService — W5-N29-b storage only', () => {
  it('persistNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor writes canonical consumption anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service =
      new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionPersistenceService(
        repository,
        new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStore(),
      );
    const outcome =
      await service.persistNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
        {
          workspaceId: 'ws-1',
          consumptionAnchorId: 'consumption-anchor-1',
          platformRetrySchedulingDecisionProjectionPublicationConsumptionType:
            'decision-projection-publication-consumption-description-foundation',
          channelScope: 'telegram,email,slack-discord-teams,push',
          correlationId: 'corr-1',
          actorId: 'actor-1',
          recordedAt,
        },
      );

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      consumptionAnchorId: 'consumption-anchor-1',
      platformRetrySchedulingDecisionProjectionPublicationConsumptionType:
        'decision-projection-publication-consumption-description-foundation',
      consumptionAnchorState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('consumption-anchor-1');
    expect(
      await service.loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
        'ws-1',
        'consumption-anchor-1',
      ),
    ).toMatchObject({
      consumptionAnchorId: 'consumption-anchor-1',
    });
  });

  it('does not persist consumption runtime, publication runtime, schedule, execution, or recovery fields', async () => {
    const repository = createRepository();
    const service =
      new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionPersistenceService(
        repository,
        new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStore(),
      );

    await service.persistNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
      {
        workspaceId: 'ws-1',
        consumptionAnchorId: 'consumption-anchor-2',
        platformRetrySchedulingDecisionProjectionPublicationConsumptionType:
          'platform-retry-scheduling-decision-projection-publication-consumption-inventory-baseline',
        recordedAt,
      },
    );

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('decisionRuntime');
    expect(anchor).not.toHaveProperty('runtimeDecisionProjection');
    expect(anchor).not.toHaveProperty('runtimePublication');
    expect(anchor).not.toHaveProperty('runtimeConsumption');
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
    const prior: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor =
      {
        workspaceId: 'ws-1',
        consumptionAnchorId: 'consumption-anchor-3',
        platformRetrySchedulingDecisionProjectionPublicationConsumptionType:
          'decision-projection-publication-consumption-description-foundation',
        consumptionAnchorState: 'anchor-recorded',
        channelScope: null,
        integrityMetadata: '{}',
        correlationId: null,
        schemaVersion: 1,
        recordedAt,
        recordedByActorId: null,
        updatedAt: recordedAt,
      };

    const outcome =
      buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState({
        workspaceId: 'ws-2',
        consumptionAnchorId: 'consumption-anchor-3',
        platformRetrySchedulingDecisionProjectionPublicationConsumptionType:
          'decision-projection-publication-consumption-description-foundation',
        recordedAt,
        prior,
      });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
