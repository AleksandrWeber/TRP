import { describe, expect, it, vi } from 'vitest';
import { createDeliveryResult } from '../notification-delivery/domain/delivery';
import { NOTIFICATION_CHANNEL_CATALOG } from '../notification-delivery/domain/notification-channel';
import { notConnectedTelegram } from '../notification-delivery/domain/telegram-connection';
import { createUserNotificationPreferences } from '../notification-delivery/domain/user-notification-preferences';
import { InMemoryTelegramAdapter } from '../notification-delivery/adapters/in-memory-telegram.adapter';
import { ProductionTelegramBotApiAdapter } from '../notification-delivery/adapters/telegram-bot-api.adapter';
import { NotificationProductService } from './notification-product.service';

const evaluatedAt = '2026-08-15T18:00:00.000Z';

function prefs() {
  return createUserNotificationPreferences({
    workspaceId: 'ws-1',
    userId: 'user-1',
    updatedAt: evaluatedAt,
  });
}

function delivery() {
  return createDeliveryResult({
    deliveryId: 'del-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    type: 'daily-report',
    reportRunId: 'run-1',
    attempts: [{ channelId: 'telegram', outcome: 'skipped', skipReason: 'channel-not-connected' }],
    createdAt: evaluatedAt,
  });
}

function harness() {
  const saved = prefs();
  const notifications = {
    listChannels: vi.fn(() => NOTIFICATION_CHANNEL_CATALOG),
    getPreferences: vi.fn(() => saved),
    upsertPreferences: vi.fn((cmd: { enabled?: boolean }) =>
      createUserNotificationPreferences({
        workspaceId: 'ws-1',
        userId: 'user-1',
        enabled: cmd.enabled ?? saved.enabled,
        updatedAt: '2026-08-15T19:00:00.000Z',
      }),
    ),
    getTelegramConnection: vi.fn(() => notConnectedTelegram('ws-1', 'user-1', evaluatedAt)),
    listDeliveries: vi.fn(() => [delivery()]),
    deliver: vi.fn(),
    connectTelegram: vi.fn(),
    sendTestNotification: vi.fn(),
  };
  const service = new NotificationProductService(
    notifications as never,
    new InMemoryTelegramAdapter(),
  );
  return { service, notifications };
}

describe('NotificationProductService (PC-06)', () => {
  it('reads existing preferences, channels, routing, and deliveries without sending', () => {
    const { service, notifications } = harness();
    const settings = service.getSettings('ws-1', 'user-1', evaluatedAt);
    expect(settings.preferences.enabled).toBe(true);
    expect(settings.telegram.connected).toBe(false);
    expect(settings.telegram.transport).toBe('in-memory');
    expect(settings.routing.controlPlane).toBe(false);
    expect(service.listChannels().items).toHaveLength(6);
    expect(service.getRouting('ws-1', 'user-1', evaluatedAt).scheduleClock.scheduler).toBe(false);

    const page = service.listDeliveries({ workspaceId: 'ws-1', q: 'daily' });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.skipReasons).toContain('channel-not-connected');
    expect(service.getDelivery('ws-1', 'del-1', 'user-1')?.attempts[0]?.skipReason).toBe(
      'channel-not-connected',
    );
    expect(service.getDelivery('ws-1', 'missing', 'user-1')).toBeNull();
    expect(notifications.deliver).not.toHaveBeenCalled();
    expect(notifications.connectTelegram).not.toHaveBeenCalled();
    expect(notifications.sendTestNotification).not.toHaveBeenCalled();
    expect(service as unknown as { deliver?: unknown }).not.toHaveProperty('deliver');
  });

  it('upserts existing preferences and does not activate reserved channels', () => {
    const { service, notifications } = harness();
    const next = service.upsertPreferences({
      workspaceId: 'ws-1',
      userId: 'user-1',
      enabled: false,
      schedule: { timezone: 'Europe/Kyiv', dailyDeliveryTime: '08:30', quietHours: null },
    });
    expect(next.enabled).toBe(false);
    expect(notifications.upsertPreferences).toHaveBeenCalled();
    expect(notifications.deliver).not.toHaveBeenCalled();
    expect(service.listChannels().items.find((item) => item.channelId === 'slack')?.offered).toBe(
      false,
    );
  });

  it('exposes channel workspace, telegram detail, and reserved email without sending', () => {
    const { service, notifications } = harness();
    const workspace = service.getChannelsWorkspace('ws-1', 'user-1', evaluatedAt);
    expect(workspace.channels).toHaveLength(6);
    expect(workspace.timing.scheduler).toBe(false);
    expect(workspace.routingMatrix.deferredChannelsActivated).toBe(false);

    const telegram = service.getChannel('ws-1', 'user-1', 'telegram', evaluatedAt);
    expect(telegram?.offered).toBe(true);
    expect(telegram?.botApiUsed).toBe(false);
    expect(telegram?.transport).toBe('in-memory');
    expect(telegram?.diagnostics.lastSkipReason).toBe('channel-not-connected');

    const email = service.getChannel('ws-1', 'user-1', 'email', evaluatedAt);
    expect(email?.offered).toBe(false);
    expect(email?.configuration.kind).toBe('reserved-inactive');
    expect(service.getChannelDiagnostics('ws-1', 'user-1', 'email')?.testAvailable).toBe(false);

    const history = service.listChannelDeliveries({
      workspaceId: 'ws-1',
      channelId: 'telegram',
    });
    expect(history.items).toHaveLength(1);
    expect(notifications.connectTelegram).not.toHaveBeenCalled();
    expect(notifications.sendTestNotification).not.toHaveBeenCalled();
    expect(notifications.deliver).not.toHaveBeenCalled();
  });

  it('projects bot-api honesty when the production adapter is bound', () => {
    const notifications = harness().notifications;
    const service = new NotificationProductService(
      notifications as never,
      new ProductionTelegramBotApiAdapter(),
    );
    const settings = service.getSettings('ws-1', 'user-1', evaluatedAt);
    expect(settings.telegram.transport).toBe('bot-api');
    expect(settings.telegram.connectAvailable).toBe(false);
    expect(settings.telegram.status).toBe('not-connected');

    const telegram = service.getChannel('ws-1', 'user-1', 'telegram', evaluatedAt);
    expect(telegram?.transport).toBe('bot-api');
    expect(telegram?.botApiUsed).toBe(true);
    expect(telegram?.liveTransportActivated).toBe(true);

    const email = service.getChannel('ws-1', 'user-1', 'email', evaluatedAt);
    expect(email?.transport).toBe('none');
    expect(email?.botApiUsed).toBe(false);
    expect(email?.liveTransportActivated).toBe(false);

    const detail = service.getDelivery('ws-1', 'del-1', 'user-1');
    expect(detail?.channelDelivery.telegramTransport).toBe('bot-api');
    expect(detail?.channelDelivery.botApiUsed).toBe(true);
    expect(notifications.deliver).not.toHaveBeenCalled();
    expect(notifications.connectTelegram).not.toHaveBeenCalled();
  });
});
