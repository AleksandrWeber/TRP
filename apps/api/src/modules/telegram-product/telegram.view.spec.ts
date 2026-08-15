import { describe, expect, it } from 'vitest';
import { createDeliveryResult } from '../notification-delivery/domain/delivery';
import { NOTIFICATION_CHANNEL_CATALOG } from '../notification-delivery/domain/notification-channel';
import {
  bindTelegramChat,
  createPendingTelegramConnection,
  notConnectedTelegram,
} from '../notification-delivery/domain/telegram-connection';
import {
  telegramDeepLink,
  toTelegramConnectView,
  toTelegramConnectionView,
  toTelegramDiagnosticsView,
  toTelegramTestView,
} from './telegram.view';

const evaluatedAt = '2026-08-15T19:00:00.000Z';

describe('PC-07 telegram product views', () => {
  it('maps connection without chat ids, tokens, Bot API, or control-plane flags', () => {
    const pending = createPendingTelegramConnection({
      workspaceId: 'ws-1',
      userId: 'user-1',
      connectionToken: 'tg-token',
      updatedAt: evaluatedAt,
    });
    const view = toTelegramConnectionView(pending);
    expect(view.status).toBe('pending');
    expect(view.pending).toBe(true);
    expect(view.connected).toBe(false);
    expect(view.completeAvailable).toBe(true);
    expect(view.connectAvailable).toBe(false);
    expect(view.deepLink).toBe(telegramDeepLink('tg-token'));
    expect(view.controlPlane).toBe(false);
    expect(view.botApiUsed).toBe(false);
    expect(view.userEnteredBind).toBe(false);
    expect(view.transport).toBe('in-memory');
    expect(JSON.stringify(view)).not.toContain('chatId');
    expect(JSON.stringify(view)).not.toContain('connectionToken');

    const connected = bindTelegramChat(pending, 'chat-auto', '2026-08-15T19:01:00.000Z');
    const connectedView = toTelegramConnectionView(connected);
    expect(connectedView.connected).toBe(true);
    expect(connectedView.verified).toBe(true);
    expect(connectedView.testAvailable).toBe(true);
    expect(connectedView.deepLink).toBeNull();
    expect(JSON.stringify(connectedView)).not.toContain('chat-auto');
    expect(JSON.stringify(connectedView)).not.toContain('chatId');
  });

  it('maps connect, test, and diagnostics as delivery projections', () => {
    const pending = createPendingTelegramConnection({
      workspaceId: 'ws-1',
      userId: 'user-1',
      connectionToken: 'tg-token',
      updatedAt: evaluatedAt,
    });
    const connect = toTelegramConnectView({
      connection: pending,
      deepLink: telegramDeepLink('tg-token'),
    });
    expect(connect.deepLink).toBe('tg://connect/tg-token');
    expect(connect.botApiUsed).toBe(false);

    const connected = bindTelegramChat(pending, 'chat-auto', '2026-08-15T19:01:00.000Z');
    const delivery = createDeliveryResult({
      deliveryId: 'del-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      type: 'daily-report',
      attempts: [{ channelId: 'telegram', outcome: 'delivered' }],
      createdAt: '2026-08-15T19:02:00.000Z',
    });
    const test = toTelegramTestView({
      connection: connected,
      delivery,
      channels: NOTIFICATION_CHANNEL_CATALOG,
    });
    expect(test.delivery.outcome).toBe('delivered');
    expect(test.delivery.channelDelivery.botApiUsed).toBe(false);
    expect(JSON.stringify(test)).not.toContain('chat-auto');

    const diagnostics = toTelegramDiagnosticsView({
      connection: connected,
      deliveries: [delivery],
    });
    expect(diagnostics.lastTelegramDelivery?.deliveryId).toBe('del-1');
    expect(diagnostics.lastTelegramDelivery?.adapterReached).toBe(true);
    expect(diagnostics.scheduler).toBe(false);
    expect(diagnostics.retries).toBe(false);
    expect(diagnostics.botApiUsed).toBe(false);

    const empty = toTelegramDiagnosticsView({
      connection: notConnectedTelegram('ws-1', 'user-1', evaluatedAt),
      deliveries: [],
    });
    expect(empty.connection.connectAvailable).toBe(true);
    expect(empty.lastTelegramDelivery).toBeNull();
  });
});
