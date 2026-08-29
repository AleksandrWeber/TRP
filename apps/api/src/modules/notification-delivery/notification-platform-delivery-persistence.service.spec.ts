import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformDeliveryAnchorState,
  type DurableNotificationPlatformDeliveryAnchor,
} from './domain/durable-notification-platform-delivery-anchor';
import type { NotificationPlatformDeliveryAnchorRepository } from './domain/notification-platform-delivery-anchor.repository';
import { NotificationPlatformDeliveryPersistenceService } from './notification-platform-delivery-persistence.service';
import { NotificationPlatformDeliveryRecoveryStore } from './notification-platform-delivery-recovery-store';

const recordedAt = '2026-08-29T19:00:00.000Z';

function createRepository(): NotificationPlatformDeliveryAnchorRepository & {
  saved: DurableNotificationPlatformDeliveryAnchor[];
} {
  const saved: DurableNotificationPlatformDeliveryAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformDeliveryAnchor>();

  return {
    saved,
    saveNotificationPlatformDeliveryAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.deliveryAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformDeliveryAnchor: vi.fn(
      async (workspaceId, deliveryAnchorId) =>
        byKey.get(`${workspaceId}:${deliveryAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformDeliveryAnchors: vi.fn(async () => saved),
  };
}

describe('NotificationPlatformDeliveryPersistenceService — W5-N06-b storage only', () => {
  it('persistDeliveryAnchor writes canonical platform delivery anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformDeliveryPersistenceService(
      repository,
      new NotificationPlatformDeliveryRecoveryStore(),
    );

    const outcome = await service.persistDeliveryAnchor({
      workspaceId: 'ws-1',
      deliveryAnchorId: 'del-1',
      platformDeliveryType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      deliveryAnchorId: 'del-1',
      platformDeliveryType: 'cross-channel-foundation',
      deliveryState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('del-1');
    expect(await service.loadAnchor('ws-1', 'del-1')).toMatchObject({
      deliveryAnchorId: 'del-1',
    });
  });

  it('does not persist dispatcher, retry, scheduler, queue worker, or transport execution fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformDeliveryPersistenceService(
      repository,
      new NotificationPlatformDeliveryRecoveryStore(),
    );

    await service.persistDeliveryAnchor({
      workspaceId: 'ws-1',
      deliveryAnchorId: 'del-2',
      platformDeliveryType: 'platform-delivery-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('dispatcherState');
    expect(anchor).not.toHaveProperty('retryState');
    expect(anchor).not.toHaveProperty('schedulerState');
    expect(anchor).not.toHaveProperty('queueWorkerState');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformDeliveryAnchor = {
      workspaceId: 'ws-1',
      deliveryAnchorId: 'del-3',
      platformDeliveryType: 'cross-channel-foundation',
      deliveryState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformDeliveryAnchorState({
      workspaceId: 'ws-2',
      deliveryAnchorId: 'del-3',
      platformDeliveryType: 'cross-channel-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});
