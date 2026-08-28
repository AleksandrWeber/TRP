import { describe, expect, it, vi } from 'vitest';
import { EmailNotificationPersistenceService } from './email-notification-persistence.service';
import type { DurableEmailNotificationAnchor } from './domain/durable-email-notification-anchor';
import type { EmailNotificationAnchorRepository } from './domain/email-notification-anchor.repository';
import { EmailNotificationRecoveryStore } from './email-notification-recovery-store';

const recordedAt = '2026-08-28T15:00:00.000Z';

function createRepository(): EmailNotificationAnchorRepository & {
  saved: DurableEmailNotificationAnchor[];
} {
  const saved: DurableEmailNotificationAnchor[] = [];
  const byKey = new Map<string, DurableEmailNotificationAnchor>();

  return {
    saved,
    saveEmailNotificationAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.notificationId}`, anchor);
      saved.push(anchor);
    }),
    loadEmailNotificationAnchor: vi.fn(
      async (workspaceId, notificationId) => byKey.get(`${workspaceId}:${notificationId}`) ?? null,
    ),
    listAllEmailNotificationAnchors: vi.fn(async () => saved),
  };
}

describe('EmailNotificationPersistenceService — W5-N02-b storage only', () => {
  it('persistNotificationAnchor writes canonical anchors without delivery execution', async () => {
    const repository = createRepository();
    const service = new EmailNotificationPersistenceService(
      repository,
      new EmailNotificationRecoveryStore(),
    );

    const outcome = await service.persistNotificationAnchor({
      workspaceId: 'ws-1',
      notificationId: 'ntf-1',
      notificationChannel: 'email',
      notificationType: 'report-complete',
      recipientIdentifier: 'user@example.com',
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
      notificationChannel: 'email',
      notificationType: 'report-complete',
      recipientIdentifier: 'user@example.com',
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
    const service = new EmailNotificationPersistenceService(
      repository,
      new EmailNotificationRecoveryStore(),
    );

    await service.persistNotificationAnchor({
      workspaceId: 'ws-1',
      notificationId: 'ntf-2',
      notificationChannel: 'email',
      notificationType: 'test-notification',
      recordedAt,
    });

    expect(repository.saved[0]).not.toHaveProperty('delivered');
    expect(repository.saved[0]).not.toHaveProperty('connected');
    expect(repository.saved[0]).not.toHaveProperty('smtpUsed');
  });

  it('rejects non-email notification channel', async () => {
    const repository = createRepository();
    const service = new EmailNotificationPersistenceService(
      repository,
      new EmailNotificationRecoveryStore(),
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
    expect(outcome.reason).toBe('notification_channel_must_be_email');
  });
});
