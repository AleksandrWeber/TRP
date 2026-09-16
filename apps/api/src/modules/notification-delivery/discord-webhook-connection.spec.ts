import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { InMemoryDiscordAdapter } from './adapters/in-memory-discord.adapter';
import { ProductionDiscordWebhookNotificationAdapter } from './adapters/production-discord-webhook-notification.adapter';
import { DiscordWebhookCredentialResolver } from './adapters/discord-webhook-credential.resolver';
import { NotificationDeliveryModule } from './notification-delivery.module';
import { NotificationDeliveryService } from './notification-delivery.service';
import {
  bindInMemoryDiscordChannelForTests,
  bindInMemoryEmailChannelForTests,
  bindInMemorySlackChannelForTests,
  bindInMemoryTelegramChannelForTests,
  stubSecretVaultForIsolatedNotificationDelivery,
} from './notification-delivery.test-harness';
import { DISCORD_CHANNEL_ADAPTER } from './ports/notification.port';

describe('Discord webhook connection and delivery', () => {
  async function createService() {
    const moduleRef = await stubSecretVaultForIsolatedNotificationDelivery(
      bindInMemoryDiscordChannelForTests(
        bindInMemorySlackChannelForTests(
          bindInMemoryEmailChannelForTests(
            bindInMemoryTelegramChannelForTests(
              Test.createTestingModule({
                imports: [NotificationDeliveryModule],
              }),
            ),
          ),
        ),
      )
        .overrideProvider(DiscordWebhookCredentialResolver)
        .useValue({
          isConfigured: async () => true,
          resolve: async () =>
            Object.freeze({
              ok: true as const,
              credential: Object.freeze({
                webhookUrl:
                  'https://discord.com/api/webhooks/123456789012345678/AbCdEfGhIjKlMnOpQrStUvWxYz',
              }),
            }),
        }),
    ).compile();
    const service = moduleRef.get(NotificationDeliveryService);
    const discord = moduleRef.get(InMemoryDiscordAdapter);
    return { moduleRef, service, discord };
  }

  it('does not become connected from bind alone', async () => {
    const { moduleRef, service } = await createService();
    const bound = await service.bindDiscordChannel({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      requestedAt: '2026-09-16T10:00:00.000Z',
      actorUserId: 'user-discord',
      actorRole: Role.Admin,
    });
    expect(bound.status).toBe('pending');
    expect(service.getDiscordConnection('ws-discord', 'user-discord').status).toBe('pending');
    await moduleRef.close();
  });

  it('transitions to connected only after a successful mocked webhook send', async () => {
    const { moduleRef, service, discord } = await createService();
    await service.bindDiscordChannel({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      requestedAt: '2026-09-16T10:00:00.000Z',
      actorUserId: 'user-discord',
      actorRole: Role.Admin,
    });
    const test = await service.sendTestDiscordNotification({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      requestedAt: '2026-09-16T10:01:00.000Z',
      actorUserId: 'user-discord',
      actorRole: Role.Admin,
    });
    expect(test.outcome).toBe('delivered');
    expect(test.attempts[0]?.channelId).toBe('discord');
    expect(service.getDiscordConnection('ws-discord', 'user-discord').status).toBe('connected');
    expect(discord.listSent()).toHaveLength(1);
    expect(JSON.stringify(test)).not.toMatch(/discord\.com\/api\/webhooks|AbCdEfGh/i);
    await moduleRef.close();
  });

  it('failed webhook send does not transition Discord to connected', async () => {
    const { moduleRef, service, discord } = await createService();
    await service.bindDiscordChannel({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      actorUserId: 'user-discord',
      actorRole: Role.Admin,
    });
    discord.failNextSend('discord_webhook_server_error');
    const test = await service.sendTestDiscordNotification({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      actorUserId: 'user-discord',
      actorRole: Role.Admin,
    });
    expect(test.outcome).toBe('failed');
    expect(service.getDiscordConnection('ws-discord', 'user-discord').status).toBe('pending');
    await moduleRef.close();
  });

  it('deliver() selects the Discord adapter when connected and explicitly routed', async () => {
    const { moduleRef, service, discord } = await createService();
    await service.bindDiscordChannel({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      actorUserId: 'user-discord',
      actorRole: Role.Admin,
    });
    await service.sendTestDiscordNotification({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      actorUserId: 'user-discord',
      actorRole: Role.Admin,
    });
    service.upsertPreferences({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      channels: { discord: true, telegram: false },
      typeRouting: {
        'daily-report': { enabled: true, channels: ['discord'] },
      },
    });
    discord.clearSent();
    const delivered = await service.deliver({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      type: 'daily-report',
      subject: 'Daily report ready',
      body: 'Report complete',
      requestedAt: '2026-09-16T12:00:00.000Z',
      actorUserId: 'user-discord',
      actorRole: Role.Admin,
    });
    expect(delivered.attempts).toEqual([
      expect.objectContaining({ channelId: 'discord', outcome: 'delivered' }),
    ]);
    expect(discord.listSent()).toHaveLength(1);
    await moduleRef.close();
  });

  it('does not default-route Discord for types that only list telegram', async () => {
    const { moduleRef, service, discord } = await createService();
    await service.bindDiscordChannel({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      actorUserId: 'user-discord',
      actorRole: Role.Admin,
    });
    await service.sendTestDiscordNotification({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      actorUserId: 'user-discord',
      actorRole: Role.Admin,
    });
    discord.clearSent();
    const delivered = await service.deliver({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      type: 'daily-report',
      subject: 'Daily report ready',
      body: 'Report complete',
      requestedAt: '2026-09-16T12:00:00.000Z',
    });
    expect(delivered.attempts.some((attempt) => attempt.channelId === 'discord')).toBe(false);
    expect(discord.listSent()).toHaveLength(0);
    await moduleRef.close();
  });

  it('preserves workspace isolation of Discord connections', async () => {
    const { moduleRef, service } = await createService();
    await service.bindDiscordChannel({
      workspaceId: 'ws-a',
      userId: 'user-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
    });
    expect(service.getDiscordConnection('ws-b', 'user-a').status).toBe('not-connected');
    expect(service.getDiscordConnection('ws-a', 'user-a').status).toBe('pending');
    await moduleRef.close();
  });

  it('disconnect returns truthful non-connected state without sending', async () => {
    const { moduleRef, service, discord } = await createService();
    await service.bindDiscordChannel({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      actorUserId: 'user-discord',
      actorRole: Role.Admin,
    });
    await service.sendTestDiscordNotification({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
      actorUserId: 'user-discord',
      actorRole: Role.Admin,
    });
    discord.clearSent();
    const disconnected = service.disconnectDiscord({
      workspaceId: 'ws-discord',
      userId: 'user-discord',
    });
    expect(disconnected.status).toBe('not-connected');
    expect(discord.listSent()).toHaveLength(0);
    await moduleRef.close();
  });

  it('keeps Push and Discord active', async () => {
    const { moduleRef, service } = await createService();
    const reserved = service
      .listChannels()
      .filter((channel) => channel.status === 'reserved-inactive')
      .map((channel) => channel.channelId);
    expect(reserved).toEqual([]);
    expect(service.listChannels().find((channel) => channel.channelId === 'discord')?.status).toBe(
      'active',
    );
    expect(service.listChannels().find((channel) => channel.channelId === 'push')?.status).toBe(
      'active',
    );
    await moduleRef.close();
  });
});

describe('production Discord webhook binding', () => {
  it('binds DISCORD_CHANNEL_ADAPTER to ProductionDiscordWebhookNotificationAdapter', async () => {
    const moduleRef = await stubSecretVaultForIsolatedNotificationDelivery(
      Test.createTestingModule({
        imports: [NotificationDeliveryModule],
      }),
    ).compile();
    const adapter = moduleRef.get(DISCORD_CHANNEL_ADAPTER);
    expect(adapter).toBeInstanceOf(ProductionDiscordWebhookNotificationAdapter);
    await moduleRef.close();
  });
});
