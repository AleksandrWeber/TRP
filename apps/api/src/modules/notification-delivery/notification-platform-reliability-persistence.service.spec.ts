import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformReliabilityAnchorState,
  type DurableNotificationPlatformReliabilityAnchor,
} from './domain/durable-notification-platform-reliability-anchor';
import type { NotificationPlatformReliabilityAnchorRepository } from './domain/notification-platform-reliability-anchor.repository';
import { NotificationPlatformReliabilityRecoveryStore } from './domain/notification-platform-reliability-recovery-store';
import { NotificationPlatformReliabilityPersistenceService } from './notification-platform-reliability-persistence.service';

const recordedAt = '2026-09-02T20:00:00.000Z';

function createRepository(): NotificationPlatformReliabilityAnchorRepository & {
  saved: DurableNotificationPlatformReliabilityAnchor[];
} {
  const saved: DurableNotificationPlatformReliabilityAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformReliabilityAnchor>();

  return {
    saved,
    saveNotificationPlatformReliabilityAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.reliabilityAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformReliabilityAnchor: vi.fn(
      async (workspaceId, reliabilityAnchorId) =>
        byKey.get(`${workspaceId}:${reliabilityAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformReliabilityAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.reliabilityAnchorId.localeCompare(b.reliabilityAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformReliabilityPersistenceService — W5-N17-b storage only', () => {
  it('persistNotificationPlatformReliabilityAnchor writes canonical platform reliability anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformReliabilityPersistenceService(
      repository,
      new NotificationPlatformReliabilityRecoveryStore(),
    );
    const outcome = await service.persistNotificationPlatformReliabilityAnchor({
      workspaceId: 'ws-1',
      reliabilityAnchorId: 'reliability-1',
      platformReliabilityType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      reliabilityAnchorId: 'reliability-1',
      platformReliabilityType: 'cross-channel-foundation',
      reliabilityState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('reliability-1');
    expect(
      await service.loadNotificationPlatformReliabilityAnchor('ws-1', 'reliability-1'),
    ).toMatchObject({
      reliabilityAnchorId: 'reliability-1',
    });
  });

  it('does not persist delivery execution, restart recovery, retry, or transport fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformReliabilityPersistenceService(
      repository,
      new NotificationPlatformReliabilityRecoveryStore(),
    );

    await service.persistNotificationPlatformReliabilityAnchor({
      workspaceId: 'ws-1',
      reliabilityAnchorId: 'reliability-2',
      platformReliabilityType: 'platform-reliability-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('deliveryExecutionState');
    expect(anchor).not.toHaveProperty('restartRecoveryState');
    expect(anchor).not.toHaveProperty('retryExecutionState');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformReliabilityAnchor = {
      workspaceId: 'ws-1',
      reliabilityAnchorId: 'reliability-3',
      platformReliabilityType: 'cross-channel-foundation',
      reliabilityState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformReliabilityAnchorState({
      workspaceId: 'ws-2',
      reliabilityAnchorId: 'reliability-3',
      platformReliabilityType: 'cross-channel-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
