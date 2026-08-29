import { describe, expect, it, vi } from 'vitest';
import type { DurablePushNotificationAnchor } from './domain/durable-push-notification-anchor';
import type { PushNotificationAnchorRepository } from './domain/push-notification-anchor.repository';
import { PushNotificationPersistenceService } from './push-notification-persistence.service';
import { PushNotificationRecoveryStore } from './push-notification-recovery-store';

const recordedAt = '2026-08-29T17:00:00.000Z';

function createRepository(): PushNotificationAnchorRepository & {
  saved: DurablePushNotificationAnchor[];
} {
  const saved: DurablePushNotificationAnchor[] = [];
  const byKey = new Map<string, DurablePushNotificationAnchor>();

  return {
    saved,
    savePushNotificationAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.notificationId}`, anchor);
      saved.push(anchor);
    }),
    loadPushNotificationAnchor: vi.fn(
      async (workspaceId, notificationId) => byKey.get(`${workspaceId}:${notificationId}`) ?? null,
    ),
    listAllPushNotificationAnchors: vi.fn(async () => saved),
  };
}

describe('PushNotificationPersistenceService — W5-N04-b storage only', () => {
  it('persistNotificationAnchor writes canonical anchors without delivery execution', async () => {
    const repository = createRepository();
    const service = new PushNotificationPersistenceService(
      repository,
      new PushNotificationRecoveryStore(),
    );

    const outcome = await service.persistNotificationAnchor({
      workspaceId: 'ws-1',
      notificationId: 'ntf-1',
      notificationChannel: 'push',
      notificationType: 'report-complete',
      recipientIdentifier: 'device-ref-1',
      templateIdentifier: 'inline:report-complete',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      notificationId: 'ntf-1',
      notificationChannel: 'push',
      notificationType: 'report-complete',
      recipientIdentifier: 'device-ref-1',
      templateIdentifier: 'inline:report-complete',
      deliveryState: 'anchor-recorded',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('ntf-1');
    expect(await service.loadAnchor('ws-1', 'ntf-1')).toMatchObject({
      notificationId: 'ntf-1',
    });
  });

  it('does not persist browser subscription payload or transport secrets', async () => {
    const repository = createRepository();
    const service = new PushNotificationPersistenceService(
      repository,
      new PushNotificationRecoveryStore(),
    );

    await service.persistNotificationAnchor({
      workspaceId: 'ws-1',
      notificationId: 'ntf-2',
      notificationChannel: 'push',
      notificationType: 'test-notification',
      recordedAt,
    });

    expect(repository.saved[0]).not.toHaveProperty('subscriptionPayload');
    expect(repository.saved[0]).not.toHaveProperty('webPushEndpoint');
    expect(repository.saved[0]).not.toHaveProperty('fcmRegistrationToken');
    expect(repository.saved[0]).not.toHaveProperty('vapidMaterial');
    expect(repository.saved[0]).not.toHaveProperty('delivered');
    expect(repository.saved[0]).not.toHaveProperty('connected');
  });

  it('rejects non-push notification channel', async () => {
    const repository = createRepository();
    const service = new PushNotificationPersistenceService(
      repository,
      new PushNotificationRecoveryStore(),
    );

    const outcome = await service.persistNotificationAnchor({
      workspaceId: 'ws-1',
      notificationId: 'ntf-3',
      notificationChannel: 'telegram',
      notificationType: 'test-notification',
      recordedAt,
    });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe('notification_channel_must_be_push');
  });
});
