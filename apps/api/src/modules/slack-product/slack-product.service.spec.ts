import { describe, expect, it, vi } from 'vitest';
import { Role } from '../identity/role';
import { InMemorySlackAdapter } from '../notification-delivery/adapters/in-memory-slack.adapter';
import { ProductionSlackWebhookNotificationAdapter } from '../notification-delivery/adapters/production-slack-webhook-notification.adapter';
import { notConnectedSlack } from '../notification-delivery/domain/slack-connection';
import { NOTIFICATION_CHANNEL_CATALOG } from '../notification-delivery/domain/notification-channel';
import { SlackProductService } from './slack-product.service';

const evaluatedAt = '2026-09-15T18:00:00.000Z';
const WEBHOOK = 'https://hooks.slack.com/services/TEAM/HOOK/TOKEN';

function harness(adapter = new InMemorySlackAdapter()) {
  let slack = notConnectedSlack('ws-1', 'user-1', evaluatedAt);
  const notifications = {
    listChannels: vi.fn(() => NOTIFICATION_CHANNEL_CATALOG),
    getSlackConnection: vi.fn(() => slack),
    bindSlackChannel: vi.fn(async () => {
      slack = {
        workspaceId: 'ws-1',
        userId: 'user-1',
        status: 'pending' as const,
        boundAt: evaluatedAt,
        updatedAt: evaluatedAt,
      };
      return slack;
    }),
    disconnectSlack: vi.fn(() => {
      slack = notConnectedSlack('ws-1', 'user-1', evaluatedAt);
      return slack;
    }),
    sendTestSlackNotification: vi.fn(async () => ({
      deliveryId: 'del-slack-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      type: 'daily-report',
      attempts: [{ channelId: 'slack', outcome: 'delivered' }],
      outcome: 'delivered',
      createdAt: evaluatedAt,
    })),
    listDeliveries: vi.fn(() => []),
  };
  const service = new SlackProductService(notifications as never, adapter);
  return { service, notifications };
}

describe('SlackProductService', () => {
  it('bind leaves Slack pending and never Connected', async () => {
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
    notifications.getSlackConnection.mockReturnValue({
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

  it('projects webhook honesty when the production adapter is bound', () => {
    const { notifications } = harness();
    const service = new SlackProductService(
      notifications as never,
      new ProductionSlackWebhookNotificationAdapter(),
    );
    const view = service.getConnection('ws-1', 'user-1');
    expect(view.transport).toBe('webhook');
    expect(view.webhookUsed).toBe(true);
    expect(view.connected).toBe(false);
  });

  it('disconnect returns not-connected', async () => {
    const { service } = harness();
    await service.bind('ws-1', 'user-1', { userId: 'user-1', role: Role.Admin });
    const view = service.disconnect('ws-1', 'user-1');
    expect(view.status).toBe('not-connected');
    expect(view.connected).toBe(false);
    expect(view.bound).toBe(false);
  });
});
