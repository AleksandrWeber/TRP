import { describe, expect, it } from 'vitest';
import { NOTIFICATION_PORTS_ACTIVE, type NotificationServicePort } from './notification.port';

describe('RC-24 Epic 6 — Notification ports', () => {
  it('activates notification service + telegram only', () => {
    expect(NOTIFICATION_PORTS_ACTIVE.notificationService).toBe(true);
    expect(NOTIFICATION_PORTS_ACTIVE.telegramChannel).toBe(true);
    expect(NOTIFICATION_PORTS_ACTIVE.emailChannel).toBe(false);
    expect(NOTIFICATION_PORTS_ACTIVE.slackChannel).toBe(false);
    expect(NOTIFICATION_PORTS_ACTIVE.rest).toBe(false);
    expect(NOTIFICATION_PORTS_ACTIVE.persistence).toBe(true);
  });

  it('does not expose trading or report-generation methods on the port shape', () => {
    const required: (keyof NotificationServicePort)[] = [
      'listChannels',
      'getPreferences',
      'upsertPreferences',
      'getTelegramConnection',
      'connectTelegram',
      'completeTelegramConnect',
      'verifyTelegramConnection',
      'disconnectTelegram',
      'sendTestNotification',
      'deliver',
      'listDeliveries',
    ];
    expect(required).toHaveLength(11);
    expect(required).not.toContain('generateReport' as keyof NotificationServicePort);
    expect(required).not.toContain('pauseTrading' as keyof NotificationServicePort);
    expect(required).not.toContain('killSwitch' as keyof NotificationServicePort);
  });
});
