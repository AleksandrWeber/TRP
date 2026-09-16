import { describe, expect, it, vi } from 'vitest';
import { Role } from '../identity/role';
import { InMemoryPushAdapter } from '../notification-delivery/adapters/in-memory-push.adapter';
import { ProductionWebPushNotificationAdapter } from '../notification-delivery/adapters/production-web-push-notification.adapter';
import { notConnectedPush } from '../notification-delivery/domain/push-connection';
import { NOTIFICATION_CHANNEL_CATALOG } from '../notification-delivery/domain/notification-channel';
import type { NotificationChannelPort } from '../notification-delivery/ports/notification.port';
import { PushProductService } from './push-product.service';

const evaluatedAt = '2026-09-16T18:00:00.000Z';
const PRIVATE_KEY = 'FAKESECRET_o3p4q5r6s7t8u9v0w1x2';
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123:APA91bSyntheticEndpointNotReal';

function harness(adapter: NotificationChannelPort = new InMemoryPushAdapter()) {
  let push = notConnectedPush('ws-1', 'user-1', evaluatedAt);
  const notifications = {
    listChannels: vi.fn(() => NOTIFICATION_CHANNEL_CATALOG),
    getPushConnection: vi.fn(() => push),
    bindPushChannel: vi.fn(async () => {
      push = {
        workspaceId: 'ws-1',
        userId: 'user-1',
        status: 'pending' as const,
        boundAt: evaluatedAt,
        updatedAt: evaluatedAt,
      };
      return push;
    }),
    disconnectPush: vi.fn(async () => {
      push = notConnectedPush('ws-1', 'user-1', evaluatedAt);
      return push;
    }),
    sendTestPushNotification: vi.fn(async () => ({
      deliveryId: 'del-push-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      type: 'daily-report',
      attempts: [{ channelId: 'push', outcome: 'delivered' }],
      outcome: 'delivered',
      createdAt: evaluatedAt,
    })),
    registerPushSubscription: vi.fn(async () => ({
      id: 'sub-1',
      status: 'active' as const,
      createdAt: evaluatedAt,
      endpointHost: 'fcm.googleapis.com',
    })),
    revokePushSubscription: vi.fn(async () => ({
      id: 'sub-1',
      status: 'revoked' as const,
      createdAt: evaluatedAt,
    })),
    getPushVapidPublicKey: vi.fn(
      async () => 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u',
    ),
    listDeliveries: vi.fn(() => []),
    listPushSubscriptions: vi.fn(async () => [
      { id: 'sub-1', status: 'active', createdAt: evaluatedAt },
    ]),
  };
  const service = new PushProductService(notifications as never, adapter);
  return { service, notifications };
}

describe('PushProductService', () => {
  it('bind leaves Push pending and never Connected', async () => {
    const { service } = harness();
    const view = await service.bind('ws-1', 'user-1', {
      userId: 'user-1',
      role: Role.Admin,
    });
    expect(view.status).toBe('pending');
    expect(view.connected).toBe(false);
    expect(view.bound).toBe(true);
    expect(JSON.stringify(view)).not.toContain(PRIVATE_KEY);
    expect(JSON.stringify(view)).not.toContain(ENDPOINT);
  });

  it('returns only public VAPID key', async () => {
    const { service, notifications } = harness();
    const view = await service.getVapidPublicKey('ws-1', {
      userId: 'user-1',
      role: Role.Admin,
    });
    expect(view.publicKey).toBeTruthy();
    expect(JSON.stringify(view)).not.toContain(PRIVATE_KEY);
    expect(notifications.getPushVapidPublicKey).toHaveBeenCalled();
  });

  it('subscription responses never echo secrets', async () => {
    const { service } = harness();
    const saved = await service.registerSubscription('ws-1', 'user-1', {
      endpoint: ENDPOINT,
      keys: {
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u',
        auth: 'tBHItJI5svbpez7KI4CCXg',
      },
    });
    expect(saved.id).toBe('sub-1');
    expect(JSON.stringify(saved)).not.toContain(ENDPOINT);
    expect(JSON.stringify(saved)).not.toContain('p256dh');
    expect(JSON.stringify(saved)).not.toContain('"auth"');
    expect(saved).not.toHaveProperty('auth');
    expect(saved).not.toHaveProperty('p256dh');
    expect(saved).not.toHaveProperty('endpoint');
  });

  it('diagnostics redact secrets and project production adapter honesty', async () => {
    const adapter = new ProductionWebPushNotificationAdapter();
    const { service, notifications } = harness(adapter);
    notifications.getPushConnection.mockReturnValue({
      workspaceId: 'ws-1',
      userId: 'user-1',
      status: 'connected',
      boundAt: evaluatedAt,
      verifiedAt: evaluatedAt,
      connectedAt: evaluatedAt,
      updatedAt: evaluatedAt,
    });
    const diagnostics = await service.getDiagnostics('ws-1', 'user-1');
    expect(diagnostics.pushUsed).toBe(true);
    expect(diagnostics.pushTransport).toBe('web-push');
    expect(diagnostics.subscriptionPresent).toBe(true);
    expect(diagnostics.activeSubscriptionCount).toBe(1);
    expect(JSON.stringify(diagnostics)).not.toContain(PRIVATE_KEY);
    expect(JSON.stringify(diagnostics)).not.toContain(ENDPOINT);
  });
});
