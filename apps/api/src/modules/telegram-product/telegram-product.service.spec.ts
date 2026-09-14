import { describe, expect, it, vi } from 'vitest';
import { Role } from '../identity/role';
import { InMemoryTelegramAdapter } from '../notification-delivery/adapters/in-memory-telegram.adapter';
import { ProductionTelegramBotApiAdapter } from '../notification-delivery/adapters/telegram-bot-api.adapter';
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

function harness(
  adapter:
    InMemoryTelegramAdapter | ProductionTelegramBotApiAdapter = new InMemoryTelegramAdapter(),
) {
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
    observePendingTelegramBind: vi.fn(async () => {
      connection = bindTelegramChat(connection, '777001', '2026-08-15T19:01:00.000Z');
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
  const service = new TelegramProductService(notifications as never, adapter);
  return { service, notifications };
}

describe('TelegramProductService (PC-07)', () => {
  it('connects then completes from observed Telegram chat id without synthesizing in-memory bind', async () => {
    const { service, notifications } = harness();
    expect(service.getConnection('ws-1', 'user-1').status).toBe('not-connected');

    const connectedPending = service.connect('ws-1', 'user-1');
    expect(connectedPending.connection.status).toBe('pending');
    expect(connectedPending.deepLink).toBe('tg://connect/tg-token');
    expect(connectedPending.userEnteredBind).toBe(false);

    const completed = await service.complete('ws-1', 'user-1', {
      userId: 'user-1',
      role: Role.Trader,
    });
    expect(completed.connected).toBe(true);
    expect(completed.testAvailable).toBe(true);
    expect(notifications.observePendingTelegramBind).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        userId: 'user-1',
        actorUserId: 'user-1',
        actorRole: Role.Trader,
      }),
    );
    expect(notifications.completeTelegramConnect).not.toHaveBeenCalled();
    expect(JSON.stringify(completed)).not.toContain(inMemoryAdapterChatId('ws-1', 'user-1'));

    expect(service.verify('ws-1', 'user-1').verified).toBe(true);
    const test = await service.sendTest('ws-1', 'user-1');
    expect(test.delivery.outcome).toBe('delivered');
    expect(test.botApiUsed).toBe(false);
    expect(test.connection.transport).toBe('in-memory');
    expect(notifications.sendTestNotification).toHaveBeenCalled();
    expect(notifications.deliver).not.toHaveBeenCalled();

    expect(service.disconnect('ws-1', 'user-1').status).toBe('not-connected');
  });

  it('rejects complete when not pending and lists telegram deliveries only', async () => {
    const { service } = harness();
    await expect(service.complete('ws-1', 'user-1')).rejects.toThrow(
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

  it('projects bot-api honesty when the production adapter is bound', async () => {
    const { service, notifications } = harness(new ProductionTelegramBotApiAdapter());
    const status = service.getConnection('ws-1', 'user-1');
    expect(status.transport).toBe('bot-api');
    expect(status.botApiUsed).toBe(true);
    expect(status.status).toBe('not-connected');
    expect(status.chatBound).toBe(false);
    expect(status.disconnectAvailable).toBe(false);

    service.connect('ws-1', 'user-1');
    const completed = await service.complete('ws-1', 'user-1', {
      userId: 'user-1',
      role: Role.Trader,
    });
    expect(completed.transport).toBe('bot-api');
    expect(completed.botApiUsed).toBe(true);
    expect(completed.chatBound).toBe(true);
    expect(completed.disconnectAvailable).toBe(true);
    expect(JSON.stringify(completed)).not.toContain('chatId');
    expect(JSON.stringify(completed)).not.toContain('777001');

    const test = await service.sendTest('ws-1', 'user-1');
    expect(test.botApiUsed).toBe(true);
    expect(test.delivery.channelDelivery.telegramTransport).toBe('bot-api');
    expect(test.delivery.channelDelivery.botApiUsed).toBe(true);
    expect(notifications.sendTestNotification).toHaveBeenCalled();
    expect(notifications.deliver).not.toHaveBeenCalled();

    const diagnostics = service.getDiagnostics('ws-1', 'user-1');
    expect(diagnostics.telegramTransport).toBe('bot-api');
    expect(diagnostics.botApiUsed).toBe(true);

    const disconnected = service.disconnect('ws-1', 'user-1');
    expect(disconnected.status).toBe('not-connected');
    expect(disconnected.transport).toBe('bot-api');
    expect(disconnected.botApiUsed).toBe(true);
    expect(disconnected.chatBound).toBe(false);
    expect(disconnected.disconnectAvailable).toBe(false);
  });
});
