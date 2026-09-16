/**
 * PC-07 — product adapter over existing NotificationServicePort Teams methods.
 *
 * Delegates bind / test / disconnect / status. Webhook URL stays in Vault
 * via Connections. Notification Delivery remains owner. Teams remains delivery-only.
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../identity/role';
import { projectTeamsTransport } from '../notification-delivery/domain/teams-transport-projection';
import {
  TEAMS_CHANNEL_ADAPTER,
  NOTIFICATION_SERVICE_PORT,
  type NotificationChannelPort,
  type NotificationServicePort,
} from '../notification-delivery/ports/notification.port';
import {
  toTeamsConnectionView,
  toTeamsDiagnosticsView,
  toTeamsTestView,
  type TeamsConnectionProductView,
  type TeamsDiagnosticsView,
  type TeamsTestProductView,
} from './teams.view';

@Injectable()
export class TeamsProductService {
  constructor(
    @Inject(NOTIFICATION_SERVICE_PORT)
    private readonly notifications: NotificationServicePort,
    @Inject(TEAMS_CHANNEL_ADAPTER)
    private readonly teamsChannel: NotificationChannelPort,
  ) {}

  private teamsHonesty() {
    return projectTeamsTransport(this.teamsChannel);
  }

  getConnection(workspaceId: string, userId: string): TeamsConnectionProductView {
    return toTeamsConnectionView(
      this.notifications.getTeamsConnection(workspaceId, userId),
      this.teamsHonesty(),
    );
  }

  async bind(
    workspaceId: string,
    userId: string,
    actor?: Readonly<{ userId: string; role: Role }>,
  ): Promise<TeamsConnectionProductView> {
    return toTeamsConnectionView(
      await this.notifications.bindTeamsChannel({
        workspaceId,
        userId,
        ...(actor ? { actorUserId: actor.userId, actorRole: actor.role } : {}),
      }),
      this.teamsHonesty(),
    );
  }

  disconnect(workspaceId: string, userId: string): TeamsConnectionProductView {
    return toTeamsConnectionView(
      this.notifications.disconnectTeams({ workspaceId, userId }),
      this.teamsHonesty(),
    );
  }

  async sendTest(
    workspaceId: string,
    userId: string,
    actor?: Readonly<{ userId: string; role: Role }>,
  ): Promise<TeamsTestProductView> {
    const delivery = await this.notifications.sendTestTeamsNotification({
      workspaceId,
      userId,
      ...(actor ? { actorUserId: actor.userId, actorRole: actor.role } : {}),
    });
    return toTeamsTestView({
      connection: this.notifications.getTeamsConnection(workspaceId, userId),
      delivery,
      channels: this.notifications.listChannels(),
      honesty: this.teamsHonesty(),
    });
  }

  getDiagnostics(workspaceId: string, userId: string): TeamsDiagnosticsView {
    return toTeamsDiagnosticsView({
      connection: this.notifications.getTeamsConnection(workspaceId, userId),
      deliveries: this.notifications.listDeliveries({ workspaceId, userId }),
      honesty: this.teamsHonesty(),
    });
  }
}
