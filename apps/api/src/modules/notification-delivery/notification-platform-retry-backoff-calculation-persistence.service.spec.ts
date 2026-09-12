import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformRetryBackoffCalculationAnchorState,
  type DurableNotificationPlatformRetryBackoffCalculationAnchor,
} from './domain/durable-notification-platform-retry-backoff-calculation-anchor';
import type { NotificationPlatformRetryBackoffCalculationAnchorRepository } from './domain/notification-platform-retry-backoff-calculation-anchor.repository';
import { NotificationPlatformRetryBackoffCalculationPersistenceService } from './notification-platform-retry-backoff-calculation-persistence.service';

const recordedAt = '2026-09-12T21:00:00.000Z';

function createRepository(): NotificationPlatformRetryBackoffCalculationAnchorRepository & {
  saved: DurableNotificationPlatformRetryBackoffCalculationAnchor[];
} {
  const saved: DurableNotificationPlatformRetryBackoffCalculationAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformRetryBackoffCalculationAnchor>();

  return {
    saved,
    saveNotificationPlatformRetryBackoffCalculationAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.calculationAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformRetryBackoffCalculationAnchor: vi.fn(
      async (workspaceId, calculationAnchorId) =>
        byKey.get(`${workspaceId}:${calculationAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformRetryBackoffCalculationAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.calculationAnchorId.localeCompare(b.calculationAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformRetryBackoffCalculationPersistenceService — W5-N22-b storage only', () => {
  it('persistNotificationPlatformRetryBackoffCalculationAnchor writes canonical calculation anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetryBackoffCalculationPersistenceService(repository);
    const outcome = await service.persistNotificationPlatformRetryBackoffCalculationAnchor({
      workspaceId: 'ws-1',
      calculationAnchorId: 'calc-anchor-1',
      platformBackoffCalculationType: 'backoff-calculation-description-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      calculationAnchorId: 'calc-anchor-1',
      platformBackoffCalculationType: 'backoff-calculation-description-foundation',
      calculationAnchorState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('calc-anchor-1');
    expect(
      await service.loadNotificationPlatformRetryBackoffCalculationAnchor('ws-1', 'calc-anchor-1'),
    ).toMatchObject({
      calculationAnchorId: 'calc-anchor-1',
    });
  });

  it('does not persist calculation runtime, schedule, execution, or recovery fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformRetryBackoffCalculationPersistenceService(repository);

    await service.persistNotificationPlatformRetryBackoffCalculationAnchor({
      workspaceId: 'ws-1',
      calculationAnchorId: 'calc-anchor-2',
      platformBackoffCalculationType: 'platform-backoff-calculation-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('backoffCalculationRuntime');
    expect(anchor).not.toHaveProperty('calculationEngineState');
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
    const prior: DurableNotificationPlatformRetryBackoffCalculationAnchor = {
      workspaceId: 'ws-1',
      calculationAnchorId: 'calc-anchor-3',
      platformBackoffCalculationType: 'backoff-calculation-description-foundation',
      calculationAnchorState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformRetryBackoffCalculationAnchorState({
      workspaceId: 'ws-2',
      calculationAnchorId: 'calc-anchor-3',
      platformBackoffCalculationType: 'backoff-calculation-description-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
