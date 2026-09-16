import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { InMemorySlackAdapter } from './adapters/in-memory-slack.adapter';
import { ProductionSlackWebhookNotificationAdapter } from './adapters/production-slack-webhook-notification.adapter';
import { SlackWebhookCredentialResolver } from './adapters/slack-webhook-credential.resolver';
import { NotificationDeliveryModule } from './notification-delivery.module';
import { NotificationDeliveryService } from './notification-delivery.service';
import {
  bindInMemoryEmailChannelForTests,
  bindInMemorySlackChannelForTests,
  bindInMemoryTelegramChannelForTests,
  stubSecretVaultForIsolatedNotificationDelivery,
} from './notification-delivery.test-harness';
import { SLACK_CHANNEL_ADAPTER } from './ports/notification.port';

describe('Slack webhook connection and delivery', () => {
  async function createService() {
    const moduleRef = await stubSecretVaultForIsolatedNotificationDelivery(
      bindInMemorySlackChannelForTests(
        bindInMemoryEmailChannelForTests(
          bindInMemoryTelegramChannelForTests(
            Test.createTestingModule({
              imports: [NotificationDeliveryModule],
            }),
          ),
        ),
      )
        .overrideProvider(SlackWebhookCredentialResolver)
        .useValue({
          isConfigured: async () => true,
          resolve: async () =>
            Object.freeze({
              ok: true as const,
              credential: Object.freeze({
                webhookUrl: 'https://hooks.slack.com/services/TEAM/HOOK/TOKEN',
              }),
            }),
        }),
    ).compile();
    const service = moduleRef.get(NotificationDeliveryService);
    const slack = moduleRef.get(InMemorySlackAdapter);
    return { moduleRef, service, slack };
  }

  it('does not become connected from bind alone', async () => {
    const { moduleRef, service } = await createService();
    const bound = await service.bindSlackChannel({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      requestedAt: '2026-09-15T10:00:00.000Z',
      actorUserId: 'user-slack',
      actorRole: Role.Admin,
    });
    expect(bound.status).toBe('pending');
    expect(service.getSlackConnection('ws-slack', 'user-slack').status).toBe('pending');
    await moduleRef.close();
  });

  it('transitions to connected only after a successful mocked webhook send', async () => {
    const { moduleRef, service, slack } = await createService();
    await service.bindSlackChannel({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      requestedAt: '2026-09-15T10:00:00.000Z',
      actorUserId: 'user-slack',
      actorRole: Role.Admin,
    });
    const test = await service.sendTestSlackNotification({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      requestedAt: '2026-09-15T10:01:00.000Z',
      actorUserId: 'user-slack',
      actorRole: Role.Admin,
    });
    expect(test.outcome).toBe('delivered');
    expect(test.attempts[0]?.channelId).toBe('slack');
    expect(service.getSlackConnection('ws-slack', 'user-slack').status).toBe('connected');
    expect(slack.listSent()).toHaveLength(1);
    expect(JSON.stringify(test)).not.toMatch(/hooks\.slack\.com|TEAM\/HOOK\/TOKEN/i);
    await moduleRef.close();
  });

  it('failed webhook send does not transition Slack to connected', async () => {
    const { moduleRef, service, slack } = await createService();
    await service.bindSlackChannel({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      actorUserId: 'user-slack',
      actorRole: Role.Admin,
    });
    slack.failNextSend('slack_webhook_server_error');
    const test = await service.sendTestSlackNotification({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      actorUserId: 'user-slack',
      actorRole: Role.Admin,
    });
    expect(test.outcome).toBe('failed');
    expect(service.getSlackConnection('ws-slack', 'user-slack').status).toBe('pending');
    await moduleRef.close();
  });

  it('deliver() selects the Slack adapter when connected and explicitly routed', async () => {
    const { moduleRef, service, slack } = await createService();
    await service.bindSlackChannel({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      actorUserId: 'user-slack',
      actorRole: Role.Admin,
    });
    await service.sendTestSlackNotification({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      actorUserId: 'user-slack',
      actorRole: Role.Admin,
    });
    service.upsertPreferences({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      channels: { slack: true, telegram: false },
      typeRouting: {
        'daily-report': { enabled: true, channels: ['slack'] },
      },
    });
    slack.clearSent();
    const delivered = await service.deliver({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      type: 'daily-report',
      subject: 'Daily report ready',
      body: 'Report complete',
      requestedAt: '2026-09-15T12:00:00.000Z',
      actorUserId: 'user-slack',
      actorRole: Role.Admin,
    });
    expect(delivered.attempts).toEqual([
      expect.objectContaining({ channelId: 'slack', outcome: 'delivered' }),
    ]);
    expect(slack.listSent()).toHaveLength(1);
    await moduleRef.close();
  });

  it('does not default-route Slack for types that only list telegram', async () => {
    const { moduleRef, service, slack } = await createService();
    await service.bindSlackChannel({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      actorUserId: 'user-slack',
      actorRole: Role.Admin,
    });
    await service.sendTestSlackNotification({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      actorUserId: 'user-slack',
      actorRole: Role.Admin,
    });
    slack.clearSent();
    const delivered = await service.deliver({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      type: 'daily-report',
      subject: 'Daily report ready',
      body: 'Report complete',
      requestedAt: '2026-09-15T12:00:00.000Z',
    });
    expect(delivered.attempts.some((attempt) => attempt.channelId === 'slack')).toBe(false);
    expect(slack.listSent()).toHaveLength(0);
    await moduleRef.close();
  });

  it('preserves workspace isolation of Slack connections', async () => {
    const { moduleRef, service } = await createService();
    await service.bindSlackChannel({
      workspaceId: 'ws-a',
      userId: 'user-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
    });
    expect(service.getSlackConnection('ws-b', 'user-a').status).toBe('not-connected');
    expect(service.getSlackConnection('ws-a', 'user-a').status).toBe('pending');
    await moduleRef.close();
  });

  it('disconnect returns truthful non-connected state without sending', async () => {
    const { moduleRef, service, slack } = await createService();
    await service.bindSlackChannel({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      actorUserId: 'user-slack',
      actorRole: Role.Admin,
    });
    await service.sendTestSlackNotification({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
      actorUserId: 'user-slack',
      actorRole: Role.Admin,
    });
    slack.clearSent();
    const disconnected = service.disconnectSlack({
      workspaceId: 'ws-slack',
      userId: 'user-slack',
    });
    expect(disconnected.status).toBe('not-connected');
    expect(slack.listSent()).toHaveLength(0);
    await moduleRef.close();
  });

  it('keeps all notification channels active including Push', async () => {
    const { moduleRef, service } = await createService();
    const reserved = service
      .listChannels()
      .filter((channel) => channel.status === 'reserved-inactive')
      .map((channel) => channel.channelId);
    expect(reserved).toEqual([]);
    await moduleRef.close();
  });
});

describe('production Slack webhook binding', () => {
  it('binds SLACK_CHANNEL_ADAPTER to ProductionSlackWebhookNotificationAdapter', async () => {
    const moduleRef = await stubSecretVaultForIsolatedNotificationDelivery(
      Test.createTestingModule({
        imports: [NotificationDeliveryModule],
      }),
    ).compile();
    const adapter = moduleRef.get(SLACK_CHANNEL_ADAPTER);
    expect(adapter).toBeInstanceOf(ProductionSlackWebhookNotificationAdapter);
    await moduleRef.close();
  });
});
