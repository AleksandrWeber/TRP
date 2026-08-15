import { describe, expect, it, vi } from 'vitest';
import { createDeliveryResult } from '../notification-delivery/domain/delivery';
import { NOTIFICATION_CHANNEL_CATALOG } from '../notification-delivery/domain/notification-channel';
import {
  bindTelegramChat,
  createPendingTelegramConnection,
  disconnectTelegramConnection,
  notConnectedTelegram,
} from '../notification-delivery/domain/telegram-connection';
import { inMemoryAdapterChatId, TelegramProductService } from './telegram-product.service';

const evaluatedAt = '2026-08-15T19:00:00.000Z';

function harness() {
  let connection = notConnectedTelegram('ws-1', 'user-1', evaluatedAt);
  const deliveries = [
    createDeliveryResult({
      deliveryId: 'del-skip',
      workspaceId: 'ws-1',
      userId: 'user-1',
      type: 'daily-report',
      attempts: [
        { channelId: 'telegram', outcome: 'skipped', skipReason: 'channel-not-connected' },
      ],
      createdAt: evaluatedAt,
    }),
  ];
  const notifications = {
    listChannels: vi.fn(() => NOTIFICATION_CHANNEL_CATALOG),
    getTelegramConnection: vi.fn(() => connection),
    connectTelegram: vi.fn(() => {
      connection = createPendingTelegramConnection({
        workspaceId: 'ws-1',
        userId: 'user-1',
        connectionToken: 'tg-token',
        updatedAt: evaluatedAt,
      });
      return { connection, deepLink: 'tg://connect/tg-token' };
    }),
    completeTelegramConnect: vi.fn((cmd: { connectionToken: string; chatId: string }) => {
      connection = bindTelegramChat(connection, cmd.chatId, '2026-08-15T19:01:00.000Z');
      return connection;
    }),
    verifyTelegramConnection: vi.fn(() => connection),
    disconnectTelegram: vi.fn(() => {
      connection = disconnectTelegramConnection(connection, '2026-08-15T19:03:00.000Z');
      return connection;
    }),
    sendTestNotification: vi.fn(() => {
      const delivery = createDeliveryResult({
        deliveryId: 'del-test',
        workspaceId: 'ws-1',
        userId: 'user-1',
        type: 'daily-report',
        attempts: [{ channelId: 'telegram', outcome: 'delivered' }],
        createdAt: '2026-08-15T19:02:00.000Z',
      });
      deliveries.push(delivery);
      return delivery;
    }),
    listDeliveries: vi.fn(() => deliveries),
    deliver: vi.fn(),
  };
  const service = new TelegramProductService(notifications as never);
  return { service, notifications };
}

describe('TelegramProductService (PC-07)', () => {
  it('exposes existing connect → complete → verify → test → disconnect without Bot API', () => {
    const { service, notifications } = harness();
    expect(service.getConnection('ws-1', 'user-1').status).toBe('not-connected');

    const connectedPending = service.connect('ws-1', 'user-1');
    expect(connectedPending.connection.status).toBe('pending');
    expect(connectedPending.deepLink).toBe('tg://connect/tg-token');
    expect(connectedPending.userEnteredBind).toBe(false);

    const completed = service.complete('ws-1', 'user-1');
    expect(completed.connected).toBe(true);
    expect(completed.testAvailable).toBe(true);
    expect(notifications.completeTelegramConnect).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionToken: 'tg-token',
        chatId: inMemoryAdapterChatId('ws-1', 'user-1'),
      }),
    );

    expect(service.verify('ws-1', 'user-1').verified).toBe(true);
    const test = service.sendTest('ws-1', 'user-1');
    expect(test.delivery.outcome).toBe('delivered');
    expect(test.botApiUsed).toBe(false);
    expect(notifications.sendTestNotification).toHaveBeenCalled();
    expect(notifications.deliver).not.toHaveBeenCalled();

    expect(service.disconnect('ws-1', 'user-1').status).toBe('not-connected');
    expect(JSON.stringify(completed)).not.toContain('in-memory:ws-1:user-1');
  });

  it('rejects complete when not pending and lists telegram deliveries only', () => {
    const { service } = harness();
    expect(() => service.complete('ws-1', 'user-1')).toThrow(
      'Telegram connection is not awaiting bind',
    );
    const page = service.listDeliveries({ workspaceId: 'ws-1' });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.skipReasons).toContain('channel-not-connected');
    expect(service.getDelivery('ws-1', 'del-skip', 'user-1')?.attempts[0]?.channelId).toBe(
      'telegram',
    );
    expect(service.getDelivery('ws-1', 'missing', 'user-1')).toBeNull();
    expect(service.getDiagnostics('ws-1', 'user-1').lastTelegramDelivery?.deliveryId).toBe(
      'del-skip',
    );
  });
});
