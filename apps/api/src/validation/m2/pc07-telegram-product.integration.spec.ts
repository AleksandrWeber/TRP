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
import { InMemoryTelegramAdapter } from '../../modules/notification-delivery/adapters/in-memory-telegram.adapter';
import { ProductionTelegramBotApiAdapter } from '../../modules/notification-delivery/adapters/telegram-bot-api.adapter';
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
 * Chat id is observed from Telegram. Notification Delivery remains owner.
 */
describe('PC-07 — Telegram product', () => {
  it('connects, completes from observed chat id, tests, and disconnects without client chat id', async () => {
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
      observePendingTelegramBind: vi.fn(async () => {
        connection = bindTelegramChat(connection, '777001', '2026-08-15T19:01:00.000Z');
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
    const service = new TelegramProductService(
      notifications as never,
      new InMemoryTelegramAdapter(),
    );
    const telegram = new TelegramController(service, access);

    const status = telegram.status({ user: OWNER }, workspace.id);
    expect(status.connectAvailable).toBe(true);
    expect(status.botApiUsed).toBe(false);
    expect(status.transport).toBe('in-memory');

    const connect = telegram.connect({ user: OWNER }, workspace.id);
    expect(connect.connection.status).toBe('pending');
    expect(connect.deepLink).toBe('tg://connect/tg-token');

    const completed = await telegram.complete({ user: OWNER }, workspace.id);
    expect(completed.connected).toBe(true);
    expect(notifications.observePendingTelegramBind).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: workspace.id,
        userId: OWNER.userId,
        actorUserId: OWNER.userId,
        actorRole: OWNER.role,
      }),
    );
    expect(notifications.completeTelegramConnect).not.toHaveBeenCalled();
    expect(JSON.stringify(completed)).not.toContain(
      inMemoryAdapterChatId(workspace.id, OWNER.userId),
    );

    expect(telegram.verify({ user: OWNER }, workspace.id).verified).toBe(true);
    const test = await telegram.sendTest({ user: OWNER }, workspace.id);
    expect(test.delivery.outcome).toBe('delivered');
    expect(test.botApiUsed).toBe(false);
    expect(notifications.sendTestNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: workspace.id,
        userId: OWNER.userId,
        actorUserId: OWNER.userId,
        actorRole: OWNER.role,
      }),
    );
    expect(notifications.deliver).not.toHaveBeenCalled();

    const history = telegram.listDeliveries({ user: OWNER }, workspace.id, {});
    expect(history.items.map((item) => item.deliveryId)).toContain('del-test');

    const disconnected = telegram.disconnect({ user: OWNER }, workspace.id);
    expect(disconnected.status).toBe('not-connected');
    expect(JSON.stringify(completed)).not.toContain('chatId');
  });

  it('projects bot-api honesty on status, test, and disconnect when the production adapter is bound', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    let connection = notConnectedTelegram(workspace.id, OWNER.userId, evaluatedAt);
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
      observePendingTelegramBind: vi.fn(async () => {
        connection = bindTelegramChat(connection, '777001', '2026-08-15T19:01:00.000Z');
        return connection;
      }),
      completeTelegramConnect: vi.fn(),
      verifyTelegramConnection: vi.fn(() => connection),
      disconnectTelegram: vi.fn(() => {
        connection = disconnectTelegramConnection(connection, '2026-08-15T19:03:00.000Z');
        return connection;
      }),
      sendTestNotification: vi.fn(() =>
        createDeliveryResult({
          deliveryId: 'del-test',
          workspaceId: workspace.id,
          userId: OWNER.userId,
          type: 'daily-report',
          attempts: [{ channelId: 'telegram', outcome: 'delivered' }],
          createdAt: '2026-08-15T19:02:00.000Z',
        }),
      ),
      listDeliveries: vi.fn(() => []),
      deliver: vi.fn(),
    };
    const telegram = new TelegramController(
      new TelegramProductService(notifications as never, new ProductionTelegramBotApiAdapter()),
      access,
    );

    const status = telegram.status({ user: OWNER }, workspace.id);
    expect(status.transport).toBe('bot-api');
    expect(status.botApiUsed).toBe(true);
    expect(status.status).toBe('not-connected');
    expect(JSON.stringify(status)).not.toContain('chatId');

    telegram.connect({ user: OWNER }, workspace.id);
    const completed = await telegram.complete({ user: OWNER }, workspace.id);
    expect(completed.transport).toBe('bot-api');
    expect(completed.botApiUsed).toBe(true);
    expect(completed.chatBound).toBe(true);
    expect(JSON.stringify(completed)).not.toContain('777001');

    const test = await telegram.sendTest({ user: OWNER }, workspace.id);
    expect(test.botApiUsed).toBe(true);
    expect(test.delivery.channelDelivery.telegramTransport).toBe('bot-api');
    expect(test.delivery.channelDelivery.botApiUsed).toBe(true);

    const disconnected = telegram.disconnect({ user: OWNER }, workspace.id);
    expect(disconnected.status).toBe('not-connected');
    expect(disconnected.transport).toBe('bot-api');
    expect(disconnected.botApiUsed).toBe(true);
    expect(disconnected.disconnectAvailable).toBe(false);
    expect(notifications.deliver).not.toHaveBeenCalled();
  });
});
