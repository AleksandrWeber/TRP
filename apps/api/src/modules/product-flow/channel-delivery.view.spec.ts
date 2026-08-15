import { describe, expect, it } from 'vitest';
import { toChannelDeliveryView } from './channel-delivery.view';

const at = '2026-08-15T17:00:00.000Z';

const channels = Object.freeze([
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

describe('PC-15 15-e — ChannelDeliveryView', () => {
  it('projects in-memory Telegram delivery without claiming Bot API or deferred activation', () => {
    const view = toChannelDeliveryView({
      workspaceId: 'ws-1',
      userId: 'user-1',
      connection: Object.freeze({
        workspaceId: 'ws-1',
        userId: 'user-1',
        status: 'connected',
        chatId: 'chat-1',
        updatedAt: at,
      }),
      channels,
      delivery: Object.freeze({
        deliveryId: 'del-1',
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
      }),
    });

    expect(view.telegramAdapterReached).toBe(true);
    expect(view.telegramOutcome).toBe('delivered');
    expect(view.telegramTransport).toBe('in-memory');
    expect(view.botApiUsed).toBe(false);
    expect(view.controlPlane).toBe(false);
    expect(view.deferredChannelsActivated).toBe(false);
    expect(view.channelActivated).toBe(false);
    expect(view.reservedChannels.find((channel) => channel.channelId === 'email')?.skipReason).toBe(
      'channel-reserved',
    );
    expect(view.reservedChannels.find((channel) => channel.channelId === 'slack')?.attempted).toBe(
      false,
    );
    expect(view.authorityClass).toBe('notification-projection');
    expect(Object.isFrozen(view)).toBe(true);
  });
});
