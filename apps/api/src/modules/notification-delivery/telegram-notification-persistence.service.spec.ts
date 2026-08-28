import { describe, expect, it, vi } from 'vitest';
import { TelegramNotificationPersistenceService } from './telegram-notification-persistence.service';
import type { DurableTelegramNotificationAnchor } from './domain/durable-telegram-notification-anchor';
import type { TelegramNotificationAnchorRepository } from './domain/telegram-notification-anchor.repository';
import { TelegramNotificationRecoveryStore } from './telegram-notification-recovery-store';

const recordedAt = '2026-08-28T14:00:00.000Z';

function createRepository(): TelegramNotificationAnchorRepository & {
  saved: DurableTelegramNotificationAnchor[];
} {
  const saved: DurableTelegramNotificationAnchor[] = [];
  const byKey = new Map<string, DurableTelegramNotificationAnchor>();

  return {
    saved,
    saveTelegramNotificationAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.notificationId}`, anchor);
      saved.push(anchor);
    }),
    loadTelegramNotificationAnchor: vi.fn(
      async (workspaceId, notificationId) => byKey.get(`${workspaceId}:${notificationId}`) ?? null,
    ),
    listAllTelegramNotificationAnchors: vi.fn(async () => saved),
  };
}

describe('TelegramNotificationPersistenceService — W5-N01-b storage only', () => {
  it('persistNotificationAnchor writes canonical anchors without delivery execution', async () => {
    const repository = createRepository();
    const service = new TelegramNotificationPersistenceService(
      repository,
      new TelegramNotificationRecoveryStore(),
    );

    const outcome = await service.persistNotificationAnchor({
      workspaceId: 'ws-1',
      notificationId: 'ntf-1',
      notificationChannel: 'telegram',
      notificationType: 'report-complete',
      recipientIdentifier: 'chat:inMemory:ws-1:user-1',
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
      notificationChannel: 'telegram',
      notificationType: 'report-complete',
      recipientIdentifier: 'chat:inMemory:ws-1:user-1',
      templateIdentifier: 'inline:report-complete',
      deliveryState: 'anchor-recorded',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('ntf-1');
    expect(await service.loadAnchor('ws-1', 'ntf-1')).toMatchObject({
      notificationId: 'ntf-1',
    });
  });

  it('does not claim delivered or connected flags on anchor rows', async () => {
    const repository = createRepository();
    const service = new TelegramNotificationPersistenceService(
      repository,
      new TelegramNotificationRecoveryStore(),
    );

    await service.persistNotificationAnchor({
      workspaceId: 'ws-1',
      notificationId: 'ntf-2',
      notificationChannel: 'telegram',
      notificationType: 'test-notification',
      recordedAt,
    });

    expect(repository.saved[0]).not.toHaveProperty('delivered');
    expect(repository.saved[0]).not.toHaveProperty('connected');
    expect(repository.saved[0]).not.toHaveProperty('botApiUsed');
  });
});
