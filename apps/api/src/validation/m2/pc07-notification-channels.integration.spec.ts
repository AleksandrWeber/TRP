import { describe, expect, it, vi } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { createUserNotificationPreferences } from '../../modules/notification-delivery/domain/user-notification-preferences';
import { createDeliveryResult } from '../../modules/notification-delivery/domain/delivery';
import { NOTIFICATION_CHANNEL_CATALOG } from '../../modules/notification-delivery/domain/notification-channel';
import { notConnectedEmail } from '../../modules/notification-delivery/domain/email-connection';
import { notConnectedTelegram } from '../../modules/notification-delivery/domain/telegram-connection';
import { NotificationChannelsController } from '../../modules/notification-product/notification.controller';
import { NotificationProductService } from '../../modules/notification-product/notification-product.service';
import { InMemoryTelegramAdapter } from '../../modules/notification-delivery/adapters/in-memory-telegram.adapter';
import { ProductionTelegramBotApiAdapter } from '../../modules/notification-delivery/adapters/telegram-bot-api.adapter';
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
 * Telegram, Email, Slack, Discord, and Teams are active. Push stays reserved.
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
      getEmailConnection: () => notConnectedEmail(workspace.id, OWNER.userId, evaluatedAt),
      listDeliveries: vi.fn(() => [delivery]),
      deliver: vi.fn(),
      connectTelegram: vi.fn(),
      sendTestNotification: vi.fn(),
    };
    const service = new NotificationProductService(
      notifications as never,
      new InMemoryTelegramAdapter(),
    );
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
    expect(home.channels.find((channel) => channel.channelId === 'slack')?.offered).toBe(true);
    expect(home.routingMatrix.rows).toHaveLength(13);
    expect(home.timing.scheduler).toBe(false);
    expect(home.timing.hourlyDigest).toBe(false);
    expect(home.deferredChannelsActivated).toBe(false);

    const telegram = channels.get({ user: OWNER }, workspace.id, { channelId: 'telegram' });
    expect(telegram.configuration.kind).toBe('telegram-connection');
    expect(telegram.diagnostics.lastSkipReason).toBe('channel-not-connected');
    expect(telegram.botApiUsed).toBe(false);
    expect(telegram.transport).toBe('in-memory');
    expect(telegram.liveTransportActivated).toBe(false);

    const email = channels.get({ user: OWNER }, workspace.id, { channelId: 'email' });
    expect(email.configuration.kind).toBe('email-connection');
    expect(email.testAvailable).toBe(false);
    expect(email.liveTransportActivated).toBe(false);
    const slack = channels.get({ user: OWNER }, workspace.id, { channelId: 'slack' });
    expect(slack.configuration.kind).toBe('slack-connection');
    expect(slack.offered).toBe(true);
    const discord = channels.get({ user: OWNER }, workspace.id, { channelId: 'discord' });
    expect(discord.configuration.kind).toBe('discord-connection');
    expect(discord.offered).toBe(true);
    const teams = channels.get({ user: OWNER }, workspace.id, { channelId: 'teams' });
    expect(teams.offered).toBe(true);
    expect(teams.configuration.kind).toBe('teams-connection');
    const push = channels.get({ user: OWNER }, workspace.id, { channelId: 'push' });
    expect(push.offered).toBe(false);
    expect(push.configuration.kind).toBe('reserved-inactive');

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

  it('projects bot-api honesty on telegram cards and keeps reserved channels none/false', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    const prefs = createUserNotificationPreferences({
      workspaceId: workspace.id,
      userId: OWNER.userId,
      updatedAt: evaluatedAt,
    });
    const notifications = {
      listChannels: () => NOTIFICATION_CHANNEL_CATALOG,
      getPreferences: () => prefs,
      getTelegramConnection: () => notConnectedTelegram(workspace.id, OWNER.userId, evaluatedAt),
      getEmailConnection: () => notConnectedEmail(workspace.id, OWNER.userId, evaluatedAt),
      listDeliveries: vi.fn(() => []),
    };
    const channels = new NotificationChannelsController(
      new NotificationProductService(notifications as never, new ProductionTelegramBotApiAdapter()),
      access,
    );

    const home = channels.workspace({ user: OWNER }, workspace.id);
    expect(home.channels.find((channel) => channel.channelId === 'telegram')?.transport).toBe(
      'bot-api',
    );
    expect(home.channels.find((channel) => channel.channelId === 'telegram')?.botApiUsed).toBe(
      true,
    );
    expect(
      home.channels.find((channel) => channel.channelId === 'telegram')?.liveTransportActivated,
    ).toBe(true);
    expect(home.channels.find((channel) => channel.channelId === 'email')?.transport).toBe(
      'in-memory',
    );
    expect(home.channels.find((channel) => channel.channelId === 'email')?.botApiUsed).toBe(false);
    expect(home.channels.find((channel) => channel.channelId === 'slack')?.transport).toBe(
      'in-memory',
    );

    const telegram = channels.get({ user: OWNER }, workspace.id, { channelId: 'telegram' });
    expect(telegram.botApiUsed).toBe(true);
    expect(telegram.configuration.botApiUsed).toBe(true);
    expect(telegram.diagnostics.botApiUsed).toBe(true);
  });
});
