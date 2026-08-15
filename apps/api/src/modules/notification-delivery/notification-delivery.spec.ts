import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { InMemoryTelegramAdapter } from './adapters/in-memory-telegram.adapter';
import { NotificationDeliveryModule } from './notification-delivery.module';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NOTIFICATION_SERVICE_PORT } from './ports/notification.port';
import { isWithinQuietHours, resolveDeliveryRoutes } from './routing/resolve-delivery-routing';
import { createUserNotificationPreferences } from './domain/user-notification-preferences';

describe('RC-24 Epic 6 — Notification Delivery behaviour', () => {
  async function createService() {
    const moduleRef = await Test.createTestingModule({
      imports: [NotificationDeliveryModule],
    }).compile();
    const service = moduleRef.get(NotificationDeliveryService);
    const port = moduleRef.get<NotificationDeliveryService>(NOTIFICATION_SERVICE_PORT);
    const telegram = moduleRef.get(InMemoryTelegramAdapter);
    return { service, port, telegram };
  }

  it('wires NotificationServicePort over Telegram adapter', async () => {
    const { service, port } = await createService();
    expect(port).toBe(service);
    const channels = service.listChannels();
    expect(channels.find((c) => c.channelId === 'telegram')?.status).toBe('active');
    expect(channels.filter((c) => c.status === 'reserved-inactive')).toHaveLength(5);
  });

  it('runs Telegram connection workflow without user-entered chat ids', async () => {
    const { service, telegram } = await createService();
    const workspaceId = 'ws-1';
    const userId = 'user-1';

    expect(service.getTelegramConnection(workspaceId, userId).status).toBe('not-connected');

    const connect = service.connectTelegram({
      workspaceId,
      userId,
      requestedAt: '2026-08-10T10:00:00.000Z',
    });
    expect(connect.connection.status).toBe('pending');
    expect(connect.deepLink).toContain(connect.connection.connectionToken!);
    expect(connect.connection.chatId).toBeUndefined();

    // Adapter / bot observes deep-link start and supplies chat id automatically.
    const connected = service.completeTelegramConnect({
      connectionToken: connect.connection.connectionToken!,
      chatId: 'chat-auto-42',
      completedAt: '2026-08-10T10:01:00.000Z',
    });
    expect(connected.status).toBe('connected');
    expect(connected.chatId).toBe('chat-auto-42');

    const verified = service.verifyTelegramConnection({ workspaceId, userId });
    expect(verified.status).toBe('connected');

    const test = service.sendTestNotification({
      workspaceId,
      userId,
      requestedAt: '2026-08-10T10:02:00.000Z',
    });
    expect(test.outcome).toBe('delivered');
    expect(telegram.listSent()).toHaveLength(1);
    expect(telegram.listSent()[0]?.chatId).toBe('chat-auto-42');

    const disconnected = service.disconnectTelegram({
      workspaceId,
      userId,
      requestedAt: '2026-08-10T10:03:00.000Z',
    });
    expect(disconnected.status).toBe('not-connected');
    expect(disconnected.chatId).toBeUndefined();
  });

  it('routes delivery using user preferences and skips reserved channels', async () => {
    const { service, telegram } = await createService();
    const workspaceId = 'ws-2';
    const userId = 'user-2';

    service.upsertPreferences({
      workspaceId,
      userId,
      enabled: true,
      typeRouting: {
        'daily-report': { enabled: true, channels: ['telegram', 'email'] },
        'order-events': { enabled: false, channels: ['telegram'] },
      },
      updatedAt: '2026-08-10T11:00:00.000Z',
    });

    const connect = service.connectTelegram({
      workspaceId,
      userId,
      requestedAt: '2026-08-10T11:01:00.000Z',
    });
    service.completeTelegramConnect({
      connectionToken: connect.connection.connectionToken!,
      chatId: 'chat-99',
      completedAt: '2026-08-10T11:02:00.000Z',
    });

    const delivered = service.deliver({
      workspaceId,
      userId,
      type: 'daily-report',
      subject: 'Daily report ready',
      body: 'Report run rr-1 complete',
      reportRunId: 'rr-1',
      requestedAt: '2026-08-10T12:00:00.000Z',
    });
    expect(delivered.outcome).toBe('delivered');
    expect(delivered.reportRunId).toBe('rr-1');
    expect(delivered.attempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ channelId: 'telegram', outcome: 'delivered' }),
        expect.objectContaining({
          channelId: 'email',
          outcome: 'skipped',
          skipReason: 'channel-reserved',
        }),
      ]),
    );
    expect(telegram.listSent()).toHaveLength(1);

    const listed = service.listDeliveries({ workspaceId, reportRunId: 'rr-1' });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.deliveryId).toBe(delivered.deliveryId);
    expect(listed[0]?.outcome).toBe('delivered');

    const skippedOrders = service.deliver({
      workspaceId,
      userId,
      type: 'order-events',
      subject: 'Order',
      body: 'should skip',
      requestedAt: '2026-08-10T12:01:00.000Z',
    });
    expect(skippedOrders.outcome).toBe('skipped');
    expect(skippedOrders.attempts[0]?.skipReason).toBe('type-disabled');
  });

  it('honours quiet hours and critical bypass', () => {
    const prefs = createUserNotificationPreferences({
      workspaceId: 'ws',
      userId: 'u',
      schedule: {
        dailyDeliveryTime: '09:00',
        timezone: 'UTC',
        quietHours: { start: '22:00', end: '07:00' },
        criticalBypassQuietHours: true,
      },
      updatedAt: '2026-08-10T00:00:00.000Z',
    });

    expect(isWithinQuietHours('23:30', prefs.schedule.quietHours!)).toBe(true);
    expect(isWithinQuietHours('08:00', prefs.schedule.quietHours!)).toBe(false);

    const quietSkip = resolveDeliveryRoutes(
      {
        workspaceId: 'ws',
        userId: 'u',
        type: 'daily-report',
        subject: 'x',
        body: 'y',
        requestedAt: '2026-08-10T23:30:00.000Z',
      },
      prefs,
      { telegramConnected: true },
    );
    expect(quietSkip[0]?.skipReason).toBe('quiet-hours');

    const criticalPass = resolveDeliveryRoutes(
      {
        workspaceId: 'ws',
        userId: 'u',
        type: 'kill-switch-activated',
        subject: 'kill',
        body: 'activated',
        requestedAt: '2026-08-10T23:30:00.000Z',
      },
      prefs,
      { telegramConnected: true },
    );
    expect(criticalPass[0]?.skipReason).toBeUndefined();
    expect(criticalPass[0]?.channelId).toBe('telegram');
  });

  it('applies the stored timezone when evaluating quiet hours', () => {
    const prefs = createUserNotificationPreferences({
      workspaceId: 'ws',
      userId: 'u',
      schedule: {
        dailyDeliveryTime: '09:00',
        timezone: 'America/New_York',
        quietHours: { start: '18:00', end: '07:00' },
        criticalBypassQuietHours: true,
      },
      updatedAt: '2026-08-10T00:00:00.000Z',
    });

    const skipped = resolveDeliveryRoutes(
      {
        workspaceId: 'ws',
        userId: 'u',
        type: 'daily-report',
        subject: 'x',
        body: 'y',
        requestedAt: '2026-08-10T23:30:00.000Z',
      },
      prefs,
      { telegramConnected: true },
    );
    expect(skipped[0]?.skipReason).toBe('quiet-hours');

    const outside = resolveDeliveryRoutes(
      {
        workspaceId: 'ws',
        userId: 'u',
        type: 'daily-report',
        subject: 'x',
        body: 'y',
        requestedAt: '2026-08-10T16:00:00.000Z',
      },
      prefs,
      { telegramConnected: true },
    );
    expect(outside[0]?.skipReason).toBeUndefined();
  });

  it('does not mutate preferences objects after upsert', async () => {
    const { service } = await createService();
    const prefs = service.upsertPreferences({
      workspaceId: 'ws-3',
      userId: 'user-3',
      enabled: false,
      updatedAt: '2026-08-10T13:00:00.000Z',
    });
    expect(Object.isFrozen(prefs)).toBe(true);
    expect(() => {
      (prefs as { enabled: boolean }).enabled = true;
    }).toThrow();
  });
});
