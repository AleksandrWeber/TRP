import { describe, expect, it, vi } from 'vitest';
import type { DeliveryResult } from '../notification-delivery/domain/delivery';
import type { TelegramConnection } from '../notification-delivery/domain/telegram-connection';
import { NotificationChannelDispatchService } from './notification-channel-dispatch.service';

const at = '2026-08-15T17:00:00.000Z';

function notConnected(): TelegramConnection {
  return Object.freeze({
    workspaceId: 'ws-1',
    userId: 'user-1',
    status: 'not-connected',
    updatedAt: at,
  });
}

function connected(): TelegramConnection {
  return Object.freeze({
    workspaceId: 'ws-1',
    userId: 'user-1',
    status: 'connected',
    connectionToken: 'tg-token',
    chatId: 'chat-15e',
    connectedAt: at,
    updatedAt: at,
  });
}

function pending(): TelegramConnection {
  return Object.freeze({
    workspaceId: 'ws-1',
    userId: 'user-1',
    status: 'pending',
    connectionToken: 'tg-token',
    updatedAt: at,
  });
}

function skippedDelivery(): DeliveryResult {
  return Object.freeze({
    deliveryId: 'del-skip',
    workspaceId: 'ws-1',
    userId: 'user-1',
    type: 'daily-report',
    reportRunId: 'run-1',
    attempts: Object.freeze([
      Object.freeze({
        channelId: 'telegram' as const,
        outcome: 'skipped' as const,
        skipReason: 'channel-not-connected' as const,
      }),
    ]),
    outcome: 'skipped',
    createdAt: at,
  });
}

function deliveredResult(): DeliveryResult {
  return Object.freeze({
    deliveryId: 'del-ok',
    workspaceId: 'ws-1',
    userId: 'user-1',
    type: 'daily-report',
    reportRunId: 'run-1',
    attempts: Object.freeze([
      Object.freeze({ channelId: 'telegram' as const, outcome: 'delivered' as const }),
      Object.freeze({
        channelId: 'email' as const,
        outcome: 'skipped' as const,
        skipReason: 'channel-reserved' as const,
      }),
    ]),
    outcome: 'delivered',
    createdAt: at,
  });
}

const catalog = Object.freeze([
  Object.freeze({ channelId: 'telegram' as const, status: 'active' as const, label: 'Telegram' }),
  Object.freeze({
    channelId: 'email' as const,
    status: 'reserved-inactive' as const,
    label: 'Email',
  }),
  Object.freeze({
    channelId: 'slack' as const,
    status: 'reserved-inactive' as const,
    label: 'Slack',
  }),
]);

function harness(overrides?: { connection?: TelegramConnection; delivery?: DeliveryResult }) {
  const connection = overrides?.connection ?? notConnected();
  const notifications = {
    deliver: vi.fn(() => overrides?.delivery ?? skippedDelivery()),
    getTelegramConnection: vi.fn(() => connection),
    connectTelegram: vi.fn(() =>
      Object.freeze({
        connection: pending(),
        deepLink: 'tg://connect/tg-token',
      }),
    ),
    completeTelegramConnect: vi.fn(() => connected()),
    listChannels: vi.fn(() => catalog),
  };
  const service = new NotificationChannelDispatchService(notifications as never);
  return { service, notifications };
}

const deliverCmd = Object.freeze({
  workspaceId: 'ws-1',
  userId: 'user-1',
  type: 'daily-report' as const,
  subject: 'Report run-1 completed',
  body: 'Delivery only.',
  reportRunId: 'run-1',
  requestedAt: at,
});

describe('PC-15 15-e — NotificationChannelDispatchService', () => {
  it('dispatches through existing deliver() without connecting Telegram', () => {
    const { service, notifications } = harness();
    const result = service.dispatch(deliverCmd);

    expect(notifications.deliver).toHaveBeenCalledWith(deliverCmd);
    expect(notifications.connectTelegram).not.toHaveBeenCalled();
    expect(result.delivery?.outcome).toBe('skipped');
    expect(result.projection.telegramAdapterReached).toBe(false);
    expect(result.projection.telegramSkipReason).toBe('channel-not-connected');
    expect(result.projection.botApiUsed).toBe(false);
    expect(result.projection.deferredChannelsActivated).toBe(false);
  });

  it('binds in-memory Telegram through existing connect/complete then reaches the adapter path', () => {
    const { service, notifications } = harness({
      connection: notConnected(),
      delivery: deliveredResult(),
    });
    notifications.getTelegramConnection
      .mockReturnValueOnce(notConnected())
      .mockReturnValue(connected());

    const result = service.bindAndDispatch(
      {
        workspaceId: 'ws-1',
        userId: 'user-1',
        platformChatId: 'chat-15e',
        requestedAt: at,
      },
      deliverCmd,
    );

    expect(notifications.connectTelegram).toHaveBeenCalledTimes(1);
    expect(notifications.completeTelegramConnect).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionToken: 'tg-token',
        chatId: 'chat-15e',
      }),
    );
    expect(notifications.deliver).toHaveBeenCalledTimes(1);
    expect(result.projection.telegramAdapterReached).toBe(true);
    expect(result.projection.telegramOutcome).toBe('delivered');
    expect(result.projection.telegramTransport).toBe('in-memory');
    expect(result.projection.botApiUsed).toBe(false);
    expect(result.projection.controlPlane).toBe(false);
    expect(
      result.projection.reservedChannels.some(
        (channel) => channel.skipReason === 'channel-reserved',
      ),
    ).toBe(true);
  });

  it('does not reconnect when Telegram is already connected', () => {
    const { service, notifications } = harness({
      connection: connected(),
      delivery: deliveredResult(),
    });
    service.bindInMemoryTelegram({
      workspaceId: 'ws-1',
      userId: 'user-1',
      platformChatId: 'chat-15e',
    });
    expect(notifications.connectTelegram).not.toHaveBeenCalled();
    expect(notifications.completeTelegramConnect).not.toHaveBeenCalled();
  });
});
