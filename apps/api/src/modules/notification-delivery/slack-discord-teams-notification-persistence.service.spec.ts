import { describe, expect, it, vi } from 'vitest';
import type { DurableSlackDiscordTeamsNotificationAnchor } from './domain/durable-slack-discord-teams-notification-anchor';
import type { SlackDiscordTeamsNotificationAnchorRepository } from './domain/slack-discord-teams-notification-anchor.repository';
import { SlackDiscordTeamsNotificationPersistenceService } from './slack-discord-teams-notification-persistence.service';
import { SlackDiscordTeamsNotificationRecoveryStore } from './slack-discord-teams-notification-recovery-store';

const recordedAt = '2026-08-29T16:00:00.000Z';

function createRepository(): SlackDiscordTeamsNotificationAnchorRepository & {
  saved: DurableSlackDiscordTeamsNotificationAnchor[];
} {
  const saved: DurableSlackDiscordTeamsNotificationAnchor[] = [];
  const byKey = new Map<string, DurableSlackDiscordTeamsNotificationAnchor>();

  return {
    saved,
    saveSlackDiscordTeamsNotificationAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.notificationId}`, anchor);
      saved.push(anchor);
    }),
    loadSlackDiscordTeamsNotificationAnchor: vi.fn(
      async (workspaceId, notificationId) => byKey.get(`${workspaceId}:${notificationId}`) ?? null,
    ),
    listAllSlackDiscordTeamsNotificationAnchors: vi.fn(async () => saved),
  };
}

describe('SlackDiscordTeamsNotificationPersistenceService — W5-N03-b storage only', () => {
  it('persistNotificationAnchor writes canonical anchors without delivery execution', async () => {
    const repository = createRepository();
    const service = new SlackDiscordTeamsNotificationPersistenceService(
      repository,
      new SlackDiscordTeamsNotificationRecoveryStore(),
    );

    const outcome = await service.persistNotificationAnchor({
      workspaceId: 'ws-1',
      notificationId: 'ntf-1',
      notificationChannel: 'slack',
      notificationType: 'report-complete',
      recipientIdentifier: '#alerts',
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
      notificationChannel: 'slack',
      notificationType: 'report-complete',
      recipientIdentifier: '#alerts',
      templateIdentifier: 'inline:report-complete',
      deliveryState: 'anchor-recorded',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('ntf-1');
    expect(await service.loadAnchor('ws-1', 'ntf-1')).toMatchObject({
      notificationId: 'ntf-1',
    });
  });

  it('accepts discord and teams notification channels', async () => {
    const repository = createRepository();
    const service = new SlackDiscordTeamsNotificationPersistenceService(
      repository,
      new SlackDiscordTeamsNotificationRecoveryStore(),
    );

    for (const [notificationId, notificationChannel] of [
      ['ntf-discord', 'discord'],
      ['ntf-teams', 'teams'],
    ] as const) {
      const outcome = await service.persistNotificationAnchor({
        workspaceId: 'ws-1',
        notificationId,
        notificationChannel,
        notificationType: 'test-notification',
        recordedAt,
      });
      expect(outcome.ok).toBe(true);
    }

    expect(repository.saved).toHaveLength(2);
  });

  it('does not claim delivered or connected flags on anchor rows', async () => {
    const repository = createRepository();
    const service = new SlackDiscordTeamsNotificationPersistenceService(
      repository,
      new SlackDiscordTeamsNotificationRecoveryStore(),
    );

    await service.persistNotificationAnchor({
      workspaceId: 'ws-1',
      notificationId: 'ntf-2',
      notificationChannel: 'slack',
      notificationType: 'test-notification',
      recordedAt,
    });

    expect(repository.saved[0]).not.toHaveProperty('delivered');
    expect(repository.saved[0]).not.toHaveProperty('connected');
    expect(repository.saved[0]).not.toHaveProperty('webhookUsed');
  });

  it('rejects non-webhook notification channel', async () => {
    const repository = createRepository();
    const service = new SlackDiscordTeamsNotificationPersistenceService(
      repository,
      new SlackDiscordTeamsNotificationRecoveryStore(),
    );

    const outcome = await service.persistNotificationAnchor({
      workspaceId: 'ws-1',
      notificationId: 'ntf-3',
      notificationChannel: 'email',
      notificationType: 'test-notification',
      recordedAt,
    });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe('notification_channel_must_be_slack_discord_or_teams');
  });
});
