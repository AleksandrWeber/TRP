import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState,
  type DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor,
} from './domain/durable-notification-platform-retry-scheduling-decision-projection-publication-anchor';
import type { NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorRepository } from './domain/notification-platform-retry-scheduling-decision-projection-publication-anchor.repository';
import { NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStore } from './domain/notification-platform-retry-scheduling-decision-projection-publication-recovery-store';
import { NotificationPlatformRetrySchedulingDecisionProjectionPublicationPersistenceService } from './notification-platform-retry-scheduling-decision-projection-publication-persistence.service';

const recordedAt = '2026-09-13T18:00:00.000Z';

function createRepository(): NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorRepository & {
  saved: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[];
} {
  const saved: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[] = [];
  const byKey = new Map<
    string,
    DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor
  >();

  return {
    saved,
    saveNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor: vi.fn(
      async (anchor) => {
        byKey.set(`${anchor.workspaceId}:${anchor.publicationAnchorId}`, anchor);
        saved.push(anchor);
      },
    ),
    loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor: vi.fn(
      async (workspaceId, publicationAnchorId) =>
        byKey.get(`${workspaceId}:${publicationAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchors: vi.fn(
      async () =>
        [...byKey.values()].sort((a, b) => {
          const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
          if (workspaceCompare !== 0) {
            return workspaceCompare;
          }
          return a.publicationAnchorId.localeCompare(b.publicationAnchorId);
        }),
    ),
  };
}

describe('NotificationPlatformRetrySchedulingDecisionProjectionPublicationPersistenceService — W5-N28-b storage only', () => {
  it('persistNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor writes canonical publication anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service =
      new NotificationPlatformRetrySchedulingDecisionProjectionPublicationPersistenceService(
        repository,
        new NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStore(),
      );
    const outcome =
      await service.persistNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor({
        workspaceId: 'ws-1',
        publicationAnchorId: 'publication-anchor-1',
        platformRetrySchedulingDecisionProjectionPublicationType:
          'decision-projection-publication-description-foundation',
        channelScope: 'telegram,email,slack-discord-teams,push',
        correlationId: 'corr-1',
        actorId: 'actor-1',
        recordedAt,
      });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      publicationAnchorId: 'publication-anchor-1',
      platformRetrySchedulingDecisionProjectionPublicationType:
        'decision-projection-publication-description-foundation',
      publicationAnchorState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('publication-anchor-1');
    expect(
      await service.loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor(
        'ws-1',
        'publication-anchor-1',
      ),
    ).toMatchObject({
      publicationAnchorId: 'publication-anchor-1',
    });
  });

  it('does not persist publication runtime, decision projection runtime, schedule, execution, or recovery fields', async () => {
    const repository = createRepository();
    const service =
      new NotificationPlatformRetrySchedulingDecisionProjectionPublicationPersistenceService(
        repository,
        new NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStore(),
      );

    await service.persistNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor({
      workspaceId: 'ws-1',
      publicationAnchorId: 'publication-anchor-2',
      platformRetrySchedulingDecisionProjectionPublicationType:
        'platform-retry-scheduling-decision-projection-publication-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('decisionRuntime');
    expect(anchor).not.toHaveProperty('runtimeDecisionProjection');
    expect(anchor).not.toHaveProperty('runtimePublication');
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
    const prior: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor = {
      workspaceId: 'ws-1',
      publicationAnchorId: 'publication-anchor-3',
      platformRetrySchedulingDecisionProjectionPublicationType:
        'decision-projection-publication-description-foundation',
      publicationAnchorState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome =
      buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState({
        workspaceId: 'ws-2',
        publicationAnchorId: 'publication-anchor-3',
        platformRetrySchedulingDecisionProjectionPublicationType:
          'decision-projection-publication-description-foundation',
        recordedAt,
        prior,
      });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
