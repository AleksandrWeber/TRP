import { describe, expect, it, vi } from 'vitest';
import { Role } from '../identity/role';
import { InMemoryTeamsAdapter } from '../notification-delivery/adapters/in-memory-teams.adapter';
import { ProductionTeamsWebhookNotificationAdapter } from '../notification-delivery/adapters/production-teams-webhook-notification.adapter';
import { notConnectedTeams } from '../notification-delivery/domain/teams-connection';
import { NOTIFICATION_CHANNEL_CATALOG } from '../notification-delivery/domain/notification-channel';
import type { NotificationChannelPort } from '../notification-delivery/ports/notification.port';
import { TeamsProductService } from './teams-product.service';

const evaluatedAt = '2026-09-16T18:00:00.000Z';
const WEBHOOK = 'https://teams.com/api/webhooks/123456789012345678/AbCdEfGhIjKlMnOpQrStUvWxYz';

function harness(adapter: NotificationChannelPort = new InMemoryTeamsAdapter()) {
  let teams = notConnectedTeams('ws-1', 'user-1', evaluatedAt);
  const notifications = {
    listChannels: vi.fn(() => NOTIFICATION_CHANNEL_CATALOG),
    getTeamsConnection: vi.fn(() => teams),
    bindTeamsChannel: vi.fn(async () => {
      teams = {
        workspaceId: 'ws-1',
        userId: 'user-1',
        status: 'pending' as const,
        boundAt: evaluatedAt,
        updatedAt: evaluatedAt,
      };
      return teams;
    }),
    disconnectTeams: vi.fn(() => {
      teams = notConnectedTeams('ws-1', 'user-1', evaluatedAt);
      return teams;
    }),
    sendTestTeamsNotification: vi.fn(async () => ({
      deliveryId: 'del-teams-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      type: 'daily-report',
      attempts: [{ channelId: 'teams', outcome: 'delivered' }],
      outcome: 'delivered',
      createdAt: evaluatedAt,
    })),
    listDeliveries: vi.fn(() => []),
  };
  const service = new TeamsProductService(notifications as never, adapter);
  return { service, notifications };
}

describe('TeamsProductService', () => {
  it('bind leaves Teams pending and never Connected', async () => {
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
    notifications.getTeamsConnection.mockReturnValue({
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
    const adapter = new ProductionTeamsWebhookNotificationAdapter();
    const { service } = harness(adapter);
    const view = service.getConnection('ws-1', 'user-1');
    expect(view.transport).toBe('webhook');
    expect(view.webhookUsed).toBe(true);
  });
});
