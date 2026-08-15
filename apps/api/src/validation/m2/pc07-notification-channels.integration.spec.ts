import { describe, expect, it, vi } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { createUserNotificationPreferences } from '../../modules/notification-delivery/domain/user-notification-preferences';
import { createDeliveryResult } from '../../modules/notification-delivery/domain/delivery';
import { NOTIFICATION_CHANNEL_CATALOG } from '../../modules/notification-delivery/domain/notification-channel';
import { notConnectedTelegram } from '../../modules/notification-delivery/domain/telegram-connection';
import { NotificationChannelsController } from '../../modules/notification-product/notification.controller';
import { NotificationProductService } from '../../modules/notification-product/notification-product.service';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';

const OWNER: AuthUser = {
  userId: 'pc07-channels',
  email: 'pc07c@example.com',
  displayName: 'PC-07 Channels',
  role: Role.Researcher,
};

const evaluatedAt = '2026-08-15T19:00:00.000Z';

/**
 * PC-07: Notification Channels HTTP over existing catalog, routing, and deliveries.
 * Telegram remains the only active transport. Reserved channels stay reserved.
 */
describe('PC-07 — Notification Channels product', () => {
  it('lists all catalog channels, routes existing types, and does not activate reserved transports', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    const prefs = createUserNotificationPreferences({
      workspaceId: workspace.id,
      userId: OWNER.userId,
      updatedAt: evaluatedAt,
    });
    const delivery = createDeliveryResult({
      deliveryId: 'del-1',
      workspaceId: workspace.id,
      userId: OWNER.userId,
      type: 'daily-report',
      attempts: [
        { channelId: 'telegram', outcome: 'skipped', skipReason: 'channel-not-connected' },
        { channelId: 'email', outcome: 'skipped', skipReason: 'channel-reserved' },
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
    const channels = new NotificationChannelsController(service, access);

    const home = channels.workspace({ user: OWNER }, workspace.id);
    expect(home.channels.map((channel) => channel.channelId)).toEqual([
      'telegram',
      'email',
      'slack',
      'discord',
      'teams',
      'push',
    ]);
    expect(home.channels.find((channel) => channel.channelId === 'telegram')?.offered).toBe(true);
    expect(home.channels.find((channel) => channel.channelId === 'slack')?.offered).toBe(false);
    expect(home.routingMatrix.rows).toHaveLength(13);
    expect(home.timing.scheduler).toBe(false);
    expect(home.timing.hourlyDigest).toBe(false);
    expect(home.deferredChannelsActivated).toBe(false);

    const telegram = channels.get({ user: OWNER }, workspace.id, { channelId: 'telegram' });
    expect(telegram.configuration.kind).toBe('telegram-connection');
    expect(telegram.diagnostics.lastSkipReason).toBe('channel-not-connected');
    expect(telegram.botApiUsed).toBe(false);

    const email = channels.get({ user: OWNER }, workspace.id, { channelId: 'email' });
    expect(email.configuration.kind).toBe('reserved-inactive');
    expect(email.testAvailable).toBe(false);
    expect(email.liveTransportActivated).toBe(false);

    const history = channels.listDeliveries(
      { user: OWNER },
      workspace.id,
      { channelId: 'email' },
      {},
    );
    expect(history.items).toHaveLength(1);
    expect(notifications.deliver).not.toHaveBeenCalled();
    expect(notifications.connectTelegram).not.toHaveBeenCalled();
    expect(notifications.sendTestNotification).not.toHaveBeenCalled();
  });
});
