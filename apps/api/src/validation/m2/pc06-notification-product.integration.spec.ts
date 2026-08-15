import { describe, expect, it, vi } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { createUserNotificationPreferences } from '../../modules/notification-delivery/domain/user-notification-preferences';
import { createDeliveryResult } from '../../modules/notification-delivery/domain/delivery';
import { NOTIFICATION_CHANNEL_CATALOG } from '../../modules/notification-delivery/domain/notification-channel';
import { notConnectedTelegram } from '../../modules/notification-delivery/domain/telegram-connection';
import { NotificationSettingsController } from '../../modules/notification-product/notification.controller';
import { NotificationDeliveriesController } from '../../modules/notification-product/notification.controller';
import { NotificationProductService } from '../../modules/notification-product/notification-product.service';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';

const OWNER: AuthUser = {
  userId: 'pc06-owner',
  email: 'pc06@example.com',
  displayName: 'PC-06',
  role: Role.Researcher,
};

const evaluatedAt = '2026-08-15T18:00:00.000Z';

/**
 * PC-06: Notification HTTP over existing NotificationServicePort.
 * Telegram remains transport only. Reporting remains report owner.
 */
describe('PC-06 — Notification product', () => {
  it('reads existing settings and delivery history without sending or connecting Telegram', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    const prefs = createUserNotificationPreferences({
      workspaceId: workspace.id,
      userId: OWNER.userId,
      schedule: {
        dailyDeliveryTime: '09:00',
        timezone: 'UTC',
        quietHours: { start: '22:00', end: '07:00' },
        criticalBypassQuietHours: true,
      },
      updatedAt: evaluatedAt,
    });
    const delivery = createDeliveryResult({
      deliveryId: 'del-1',
      workspaceId: workspace.id,
      userId: OWNER.userId,
      type: 'daily-report',
      reportRunId: 'run-1',
      attempts: [
        { channelId: 'telegram', outcome: 'skipped', skipReason: 'channel-not-connected' },
      ],
      createdAt: evaluatedAt,
    });
    const notifications = {
      listChannels: () => NOTIFICATION_CHANNEL_CATALOG,
      getPreferences: () => prefs,
      upsertPreferences: vi.fn(() => prefs),
      getTelegramConnection: () => notConnectedTelegram(workspace.id, OWNER.userId, evaluatedAt),
      listDeliveries: vi.fn(() => [delivery]),
      deliver: vi.fn(),
      connectTelegram: vi.fn(),
      sendTestNotification: vi.fn(),
    };
    const service = new NotificationProductService(notifications as never);
    const settings = new NotificationSettingsController(service, access);
    const deliveries = new NotificationDeliveriesController(service, access);

    const snapshot = settings.get({ user: OWNER }, workspace.id);
    expect(snapshot.preferences.schedule.dailyDeliveryTime).toBe('09:00');
    expect(snapshot.telegram.connected).toBe(false);
    expect(snapshot.telegram.connectAvailable).toBe(false);
    expect(snapshot.channels.find((channel) => channel.channelId === 'email')?.offered).toBe(false);
    expect(snapshot.controlPlane).toBe(false);

    const page = deliveries.list({ user: OWNER }, workspace.id, { type: 'daily-report' });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.skipReasons).toContain('channel-not-connected');
    expect(notifications.deliver).not.toHaveBeenCalled();
    expect(notifications.connectTelegram).not.toHaveBeenCalled();
    expect(notifications.sendTestNotification).not.toHaveBeenCalled();
  });
});
