import { describe, expect, it } from 'vitest';
import { createUserNotificationPreferences } from '../notification-delivery/domain/user-notification-preferences';
import { createDeliveryResult } from '../notification-delivery/domain/delivery';
import { NOTIFICATION_CHANNEL_CATALOG } from '../notification-delivery/domain/notification-channel';
import { notConnectedTelegram } from '../notification-delivery/domain/telegram-connection';
import {
  deliveryMatchesQuery,
  toDeliveryDetailView,
  toPreferenceClockView,
  toSettingsView,
} from './notification.view';

const evaluatedAt = '2026-08-15T18:00:00.000Z';

function prefs() {
  return createUserNotificationPreferences({
    workspaceId: 'ws-1',
    userId: 'user-1',
    schedule: {
      dailyDeliveryTime: '09:00',
      timezone: 'UTC',
      quietHours: { start: '22:00', end: '07:00' },
      criticalBypassQuietHours: true,
    },
    updatedAt: evaluatedAt,
  });
}

describe('PC-06 notification product views', () => {
  it('maps settings as a delivery projection without chat ids or control-plane flags', () => {
    const view = toSettingsView({
      prefs: prefs(),
      channels: NOTIFICATION_CHANNEL_CATALOG,
      connection: notConnectedTelegram('ws-1', 'user-1', evaluatedAt),
      evaluatedAt,
    });
    expect(view.authorityClass).toBe('notification-projection');
    expect(view.generatesReports).toBe(false);
    expect(view.controlPlane).toBe(false);
    expect(view.deferredChannelsActivated).toBe(false);
    expect(view.telegram.connectAvailable).toBe(false);
    expect(view.telegram.testAvailable).toBe(false);
    expect(view.telegram.connected).toBe(false);
    expect(JSON.stringify(view)).not.toContain('chatId');
    expect(JSON.stringify(view)).not.toContain('connectionToken');
    expect(view.channels.find((channel) => channel.channelId === 'telegram')?.offered).toBe(true);
    expect(view.channels.find((channel) => channel.channelId === 'email')?.offered).toBe(false);
    expect(view.scheduleClock.scheduler).toBe(false);
    expect(view.scheduleClock.clockKind).toBe('preference-clock');
    expect(view.scheduleClock.dailyDeliveryTime).toBe('09:00');
    expect(view.preferences.typeRouting).toHaveLength(13);
  });

  it('honours stored timezone on the preference clock without introducing a scheduler', () => {
    const zoned = createUserNotificationPreferences({
      workspaceId: 'ws-1',
      userId: 'user-1',
      schedule: {
        dailyDeliveryTime: '09:00',
        timezone: 'America/New_York',
        quietHours: { start: '18:00', end: '07:00' },
        criticalBypassQuietHours: true,
      },
      updatedAt: evaluatedAt,
    });
    const clock = toPreferenceClockView(zoned, '2026-08-15T23:30:00.000Z');
    expect(clock.timezone).toBe('America/New_York');
    expect(clock.localTimeHHmm).toBe('19:30');
    expect(clock.quietHoursActive).toBe(true);
    expect(clock.dailyDeliveryReached).toBe(true);
    expect(clock.scheduler).toBe(false);
  });

  it('maps delivery details with recorded skip reasons and never generates reports', () => {
    const delivery = createDeliveryResult({
      deliveryId: 'del-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      type: 'daily-report',
      reportRunId: 'run-1',
      attempts: [
        { channelId: 'telegram', outcome: 'skipped', skipReason: 'channel-not-connected' },
        { channelId: 'email', outcome: 'skipped', skipReason: 'channel-reserved' },
      ],
      createdAt: evaluatedAt,
    });
    const detail = toDeliveryDetailView({
      delivery,
      connection: notConnectedTelegram('ws-1', 'user-1', evaluatedAt),
      channels: NOTIFICATION_CHANNEL_CATALOG,
    });
    expect(detail.outcome).toBe('skipped');
    expect(detail.skipReasons).toEqual(['channel-not-connected', 'channel-reserved']);
    expect(detail.generatesReports).toBe(false);
    expect(detail.channelDelivery.botApiUsed).toBe(false);
    expect(detail.channelDelivery.deferredChannelsActivated).toBe(false);
    expect(deliveryMatchesQuery(delivery, { workspaceId: 'ws-1', q: 'not-connected' })).toBe(true);
    expect(deliveryMatchesQuery(delivery, { workspaceId: 'ws-1', type: 'weekly-report' })).toBe(
      false,
    );
  });
});
