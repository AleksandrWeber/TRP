import { describe, expect, it, vi } from 'vitest';
import { Role } from '../identity/role';
import { InMemoryDiscordAdapter } from '../notification-delivery/adapters/in-memory-discord.adapter';
import { ProductionDiscordWebhookNotificationAdapter } from '../notification-delivery/adapters/production-discord-webhook-notification.adapter';
import { notConnectedDiscord } from '../notification-delivery/domain/discord-connection';
import { NOTIFICATION_CHANNEL_CATALOG } from '../notification-delivery/domain/notification-channel';
import type { NotificationChannelPort } from '../notification-delivery/ports/notification.port';
import { DiscordProductService } from './discord-product.service';

const evaluatedAt = '2026-09-16T18:00:00.000Z';
const WEBHOOK = 'https://discord.com/api/webhooks/123456789012345678/AbCdEfGhIjKlMnOpQrStUvWxYz';

function harness(adapter: NotificationChannelPort = new InMemoryDiscordAdapter()) {
  let discord = notConnectedDiscord('ws-1', 'user-1', evaluatedAt);
  const notifications = {
    listChannels: vi.fn(() => NOTIFICATION_CHANNEL_CATALOG),
    getDiscordConnection: vi.fn(() => discord),
    bindDiscordChannel: vi.fn(async () => {
      discord = {
        workspaceId: 'ws-1',
        userId: 'user-1',
        status: 'pending' as const,
        boundAt: evaluatedAt,
        updatedAt: evaluatedAt,
      };
      return discord;
    }),
    disconnectDiscord: vi.fn(() => {
      discord = notConnectedDiscord('ws-1', 'user-1', evaluatedAt);
      return discord;
    }),
    sendTestDiscordNotification: vi.fn(async () => ({
      deliveryId: 'del-discord-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      type: 'daily-report',
      attempts: [{ channelId: 'discord', outcome: 'delivered' }],
      outcome: 'delivered',
      createdAt: evaluatedAt,
    })),
    listDeliveries: vi.fn(() => []),
  };
  const service = new DiscordProductService(notifications as never, adapter);
  return { service, notifications };
}

describe('DiscordProductService', () => {
  it('bind leaves Discord pending and never Connected', async () => {
    const { service } = harness();
    const view = await service.bind('ws-1', 'user-1', {
      userId: 'user-1',
      role: Role.Admin,
    });
    expect(view.status).toBe('pending');
    expect(view.connected).toBe(false);
    expect(view.bound).toBe(true);
    expect(JSON.stringify(view)).not.toContain(WEBHOOK);
    expect(JSON.stringify(view)).not.toContain('webhookUrl');
  });

  it('successful test reports Connected without exposing secrets', async () => {
    const { service, notifications } = harness();
    await service.bind('ws-1', 'user-1', { userId: 'user-1', role: Role.Admin });
    notifications.getDiscordConnection.mockReturnValue({
      workspaceId: 'ws-1',
      userId: 'user-1',
      status: 'connected',
      boundAt: evaluatedAt,
      verifiedAt: evaluatedAt,
      connectedAt: evaluatedAt,
      updatedAt: evaluatedAt,
    });
    const test = await service.sendTest('ws-1', 'user-1', {
      userId: 'user-1',
      role: Role.Admin,
    });
    expect(test.connection.connected).toBe(true);
    expect(test.webhookUsed).toBe(false);
    expect(JSON.stringify(test)).not.toContain(WEBHOOK);
    expect(JSON.stringify(test)).not.toContain('webhookUrl');
  });

  it('projects webhookUsed when production adapter is bound', () => {
    const adapter = new ProductionDiscordWebhookNotificationAdapter();
    const { service } = harness(adapter);
    const view = service.getConnection('ws-1', 'user-1');
    expect(view.transport).toBe('webhook');
    expect(view.webhookUsed).toBe(true);
  });
});
