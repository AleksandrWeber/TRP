/**
 * PC-07 — product adapter over existing NotificationServicePort Discord methods.
 *
 * Delegates bind / test / disconnect / status. Webhook URL stays in Vault
 * via Connections. Notification Delivery remains owner. Discord remains delivery-only.
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../identity/role';
import { projectDiscordTransport } from '../notification-delivery/domain/discord-transport-projection';
import {
  DISCORD_CHANNEL_ADAPTER,
  NOTIFICATION_SERVICE_PORT,
  type NotificationChannelPort,
  type NotificationServicePort,
} from '../notification-delivery/ports/notification.port';
import {
  toDiscordConnectionView,
  toDiscordDiagnosticsView,
  toDiscordTestView,
  type DiscordConnectionProductView,
  type DiscordDiagnosticsView,
  type DiscordTestProductView,
} from './discord.view';

@Injectable()
export class DiscordProductService {
  constructor(
    @Inject(NOTIFICATION_SERVICE_PORT)
    private readonly notifications: NotificationServicePort,
    @Inject(DISCORD_CHANNEL_ADAPTER)
    private readonly discordChannel: NotificationChannelPort,
  ) {}

  private discordHonesty() {
    return projectDiscordTransport(this.discordChannel);
  }

  getConnection(workspaceId: string, userId: string): DiscordConnectionProductView {
    return toDiscordConnectionView(
      this.notifications.getDiscordConnection(workspaceId, userId),
      this.discordHonesty(),
    );
  }

  async bind(
    workspaceId: string,
    userId: string,
    actor?: Readonly<{ userId: string; role: Role }>,
  ): Promise<DiscordConnectionProductView> {
    return toDiscordConnectionView(
      await this.notifications.bindDiscordChannel({
        workspaceId,
        userId,
        ...(actor ? { actorUserId: actor.userId, actorRole: actor.role } : {}),
      }),
      this.discordHonesty(),
    );
  }

  disconnect(workspaceId: string, userId: string): DiscordConnectionProductView {
    return toDiscordConnectionView(
      this.notifications.disconnectDiscord({ workspaceId, userId }),
      this.discordHonesty(),
    );
  }

  async sendTest(
    workspaceId: string,
    userId: string,
    actor?: Readonly<{ userId: string; role: Role }>,
  ): Promise<DiscordTestProductView> {
    const delivery = await this.notifications.sendTestDiscordNotification({
      workspaceId,
      userId,
      ...(actor ? { actorUserId: actor.userId, actorRole: actor.role } : {}),
    });
    return toDiscordTestView({
      connection: this.notifications.getDiscordConnection(workspaceId, userId),
      delivery,
      channels: this.notifications.listChannels(),
      honesty: this.discordHonesty(),
    });
  }

  getDiagnostics(workspaceId: string, userId: string): DiscordDiagnosticsView {
    return toDiscordDiagnosticsView({
      connection: this.notifications.getDiscordConnection(workspaceId, userId),
      deliveries: this.notifications.listDeliveries({ workspaceId, userId }),
      honesty: this.discordHonesty(),
    });
  }
}
