import { describe, expect, it, vi } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { createDeliveryResult } from '../../modules/notification-delivery/domain/delivery';
import { NOTIFICATION_CHANNEL_CATALOG } from '../../modules/notification-delivery/domain/notification-channel';
import {
  bindTelegramChat,
  createPendingTelegramConnection,
  disconnectTelegramConnection,
  notConnectedTelegram,
} from '../../modules/notification-delivery/domain/telegram-connection';
import { TelegramController } from '../../modules/telegram-product/telegram.controller';
import {
  inMemoryAdapterChatId,
  TelegramProductService,
} from '../../modules/telegram-product/telegram-product.service';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';

const OWNER: AuthUser = {
  userId: 'pc07-owner',
  email: 'pc07@example.com',
  displayName: 'PC-07',
  role: Role.Researcher,
};

const evaluatedAt = '2026-08-15T19:00:00.000Z';

/**
 * PC-07: Telegram HTTP over existing NotificationServicePort Telegram methods.
 * Chat id remains adapter-supplied. Notification Delivery remains owner.
 */
describe('PC-07 — Telegram product', () => {
  it('connects, completes with adapter chat id, tests, and disconnects without Bot API', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    let connection = notConnectedTelegram(workspace.id, OWNER.userId, evaluatedAt);
    const deliveries = [
      createDeliveryResult({
        deliveryId: 'del-1',
        workspaceId: workspace.id,
        userId: OWNER.userId,
        type: 'daily-report',
        attempts: [
          { channelId: 'telegram', outcome: 'skipped', skipReason: 'channel-not-connected' },
        ],
        createdAt: evaluatedAt,
      }),
    ];
    const notifications = {
      listChannels: () => NOTIFICATION_CHANNEL_CATALOG,
      getTelegramConnection: () => connection,
      connectTelegram: vi.fn(() => {
        connection = createPendingTelegramConnection({
          workspaceId: workspace.id,
          userId: OWNER.userId,
          connectionToken: 'tg-token',
          updatedAt: evaluatedAt,
        });
        return { connection, deepLink: 'tg://connect/tg-token' };
      }),
      completeTelegramConnect: vi.fn((cmd: { chatId: string }) => {
        connection = bindTelegramChat(connection, cmd.chatId, '2026-08-15T19:01:00.000Z');
        return connection;
      }),
      verifyTelegramConnection: vi.fn(() => connection),
      disconnectTelegram: vi.fn(() => {
        connection = disconnectTelegramConnection(connection, '2026-08-15T19:03:00.000Z');
        return connection;
      }),
      sendTestNotification: vi.fn(() => {
        const delivery = createDeliveryResult({
          deliveryId: 'del-test',
          workspaceId: workspace.id,
          userId: OWNER.userId,
          type: 'daily-report',
          attempts: [{ channelId: 'telegram', outcome: 'delivered' }],
          createdAt: '2026-08-15T19:02:00.000Z',
        });
        deliveries.push(delivery);
        return delivery;
      }),
      listDeliveries: vi.fn(() => deliveries),
      deliver: vi.fn(),
    };
    const service = new TelegramProductService(notifications as never);
    const telegram = new TelegramController(service, access);

    const status = telegram.status({ user: OWNER }, workspace.id);
    expect(status.connectAvailable).toBe(true);
    expect(status.botApiUsed).toBe(false);

    const connect = telegram.connect({ user: OWNER }, workspace.id);
    expect(connect.connection.status).toBe('pending');
    expect(connect.deepLink).toBe('tg://connect/tg-token');

    const completed = telegram.complete({ user: OWNER }, workspace.id);
    expect(completed.connected).toBe(true);
    expect(notifications.completeTelegramConnect).toHaveBeenCalledWith(
      expect.objectContaining({
        chatId: inMemoryAdapterChatId(workspace.id, OWNER.userId),
      }),
    );

    expect(telegram.verify({ user: OWNER }, workspace.id).verified).toBe(true);
    const test = telegram.sendTest({ user: OWNER }, workspace.id);
    expect(test.delivery.outcome).toBe('delivered');
    expect(test.botApiUsed).toBe(false);
    expect(notifications.deliver).not.toHaveBeenCalled();

    const history = telegram.listDeliveries({ user: OWNER }, workspace.id, {});
    expect(history.items.map((item) => item.deliveryId)).toContain('del-test');

    const disconnected = telegram.disconnect({ user: OWNER }, workspace.id);
    expect(disconnected.status).toBe('not-connected');
    expect(JSON.stringify(completed)).not.toContain('chatId');
  });
});
