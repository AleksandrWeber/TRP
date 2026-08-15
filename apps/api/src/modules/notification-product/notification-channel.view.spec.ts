import { describe, expect, it } from 'vitest';
import { createDeliveryResult } from '../notification-delivery/domain/delivery';
import { NOTIFICATION_CHANNEL_CATALOG } from '../notification-delivery/domain/notification-channel';
import { notConnectedTelegram } from '../notification-delivery/domain/telegram-connection';
import { createUserNotificationPreferences } from '../notification-delivery/domain/user-notification-preferences';
import {
  toChannelDetailView,
  toChannelsWorkspaceView,
  toDeliveryTimingView,
} from './notification-channel.view';

const evaluatedAt = '2026-08-15T19:00:00.000Z';

function prefs() {
  return createUserNotificationPreferences({
    workspaceId: 'ws-1',
    userId: 'user-1',
    updatedAt: evaluatedAt,
  });
}

describe('PC-07 notification channel product views', () => {
  it('maps channel cards and routing matrix without activating reserved transports', () => {
    const view = toChannelsWorkspaceView({
      prefs: prefs(),
      channels: NOTIFICATION_CHANNEL_CATALOG,
      connection: notConnectedTelegram('ws-1', 'user-1', evaluatedAt),
      evaluatedAt,
    });
    expect(view.channels).toHaveLength(6);
    expect(view.channels.find((channel) => channel.channelId === 'telegram')?.offered).toBe(true);
    expect(view.channels.find((channel) => channel.channelId === 'email')?.offered).toBe(false);
    expect(view.channels.find((channel) => channel.channelId === 'email')?.configurable).toBe(
      false,
    );
    expect(view.deferredChannelsActivated).toBe(false);
    expect(view.timing.scheduler).toBe(false);
    expect(view.timing.hourlyDigest).toBe(false);
    expect(view.timing.perChannelQuietHours).toBe(false);
    expect(view.routingMatrix.rows).toHaveLength(13);
    expect(view.routingMatrix.offeredChannelIds).toEqual(['telegram']);
    expect(JSON.stringify(view)).not.toContain('smtp');
    expect(JSON.stringify(view)).not.toContain('webhook');
  });

  it('maps telegram as configurable and email as reserved disclosure', () => {
    const telegram = toChannelDetailView({
      channelId: 'telegram',
      prefs: prefs(),
      channels: NOTIFICATION_CHANNEL_CATALOG,
      connection: notConnectedTelegram('ws-1', 'user-1', evaluatedAt),
      deliveries: [
        createDeliveryResult({
          deliveryId: 'del-1',
          workspaceId: 'ws-1',
          userId: 'user-1',
          type: 'daily-report',
          attempts: [
            { channelId: 'telegram', outcome: 'skipped', skipReason: 'channel-not-connected' },
          ],
          createdAt: evaluatedAt,
        }),
      ],
      evaluatedAt,
    });
    expect(telegram?.configuration.kind).toBe('telegram-connection');
    expect(telegram?.diagnostics.configurationHealth).toBe('not-connected');
    expect(telegram?.diagnostics.lastSkipReason).toBe('channel-not-connected');
    expect(telegram?.botApiUsed).toBe(false);

    const email = toChannelDetailView({
      channelId: 'email',
      prefs: prefs(),
      channels: NOTIFICATION_CHANNEL_CATALOG,
      connection: notConnectedTelegram('ws-1', 'user-1', evaluatedAt),
      deliveries: [],
      evaluatedAt,
    });
    expect(email?.configuration.kind).toBe('reserved-inactive');
    expect(email?.configuration.requiredFields).toContain('Provider / SMTP');
    expect(email?.testAvailable).toBe(false);
    expect(email?.diagnostics.configurationHealth).toBe('reserved-inactive');
    expect(toDeliveryTimingView(prefs()).producerTiming).toBe('immediate-on-deliver');
  });
});
