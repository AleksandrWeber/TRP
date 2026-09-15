/**
 * PC-07 — product adapter over existing NotificationServicePort Slack methods.
 *
 * Delegates bind / test / disconnect / status. Webhook URL stays in Vault
 * via Connections. Notification Delivery remains owner. Slack remains delivery-only.
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../identity/role';
import { projectSlackTransport } from '../notification-delivery/domain/slack-transport-projection';
import {
  NOTIFICATION_SERVICE_PORT,
  SLACK_CHANNEL_ADAPTER,
  type NotificationChannelPort,
  type NotificationServicePort,
} from '../notification-delivery/ports/notification.port';
import {
  toSlackConnectionView,
  toSlackDiagnosticsView,
  toSlackTestView,
  type SlackConnectionProductView,
  type SlackDiagnosticsView,
  type SlackTestProductView,
} from './slack.view';

@Injectable()
export class SlackProductService {
  constructor(
    @Inject(NOTIFICATION_SERVICE_PORT)
    private readonly notifications: NotificationServicePort,
    @Inject(SLACK_CHANNEL_ADAPTER)
    private readonly slackChannel: NotificationChannelPort,
  ) {}

  private slackHonesty() {
    return projectSlackTransport(this.slackChannel);
  }

  getConnection(workspaceId: string, userId: string): SlackConnectionProductView {
    return toSlackConnectionView(
      this.notifications.getSlackConnection(workspaceId, userId),
      this.slackHonesty(),
    );
  }

  async bind(
    workspaceId: string,
    userId: string,
    actor?: Readonly<{ userId: string; role: Role }>,
  ): Promise<SlackConnectionProductView> {
    return toSlackConnectionView(
      await this.notifications.bindSlackChannel({
        workspaceId,
        userId,
        ...(actor ? { actorUserId: actor.userId, actorRole: actor.role } : {}),
      }),
      this.slackHonesty(),
    );
  }

  disconnect(workspaceId: string, userId: string): SlackConnectionProductView {
    return toSlackConnectionView(
      this.notifications.disconnectSlack({ workspaceId, userId }),
      this.slackHonesty(),
    );
  }

  async sendTest(
    workspaceId: string,
    userId: string,
    actor?: Readonly<{ userId: string; role: Role }>,
  ): Promise<SlackTestProductView> {
    const delivery = await this.notifications.sendTestSlackNotification({
      workspaceId,
      userId,
      ...(actor ? { actorUserId: actor.userId, actorRole: actor.role } : {}),
    });
    return toSlackTestView({
      connection: this.notifications.getSlackConnection(workspaceId, userId),
      delivery,
      channels: this.notifications.listChannels(),
      honesty: this.slackHonesty(),
    });
  }

  getDiagnostics(workspaceId: string, userId: string): SlackDiagnosticsView {
    return toSlackDiagnosticsView({
      connection: this.notifications.getSlackConnection(workspaceId, userId),
      deliveries: this.notifications.listDeliveries({ workspaceId, userId }),
      honesty: this.slackHonesty(),
    });
  }
}
