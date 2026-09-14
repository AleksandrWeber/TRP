/**
 * PC-07 — product adapter over existing NotificationServicePort Email methods.
 *
 * Delegates bind / test / disconnect / status. SMTP credentials stay in Vault
 * via Connections. Notification Delivery remains owner. Email remains delivery-only.
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../identity/role';
import { projectEmailTransport } from '../notification-delivery/domain/email-transport-projection';
import {
  EMAIL_CHANNEL_ADAPTER,
  NOTIFICATION_SERVICE_PORT,
  type NotificationChannelPort,
  type NotificationServicePort,
} from '../notification-delivery/ports/notification.port';
import {
  toEmailConnectionView,
  toEmailDiagnosticsView,
  toEmailTestView,
  type EmailConnectionProductView,
  type EmailDiagnosticsView,
  type EmailTestProductView,
} from './email.view';

@Injectable()
export class EmailProductService {
  constructor(
    @Inject(NOTIFICATION_SERVICE_PORT)
    private readonly notifications: NotificationServicePort,
    @Inject(EMAIL_CHANNEL_ADAPTER)
    private readonly emailChannel: NotificationChannelPort,
  ) {}

  private emailHonesty() {
    return projectEmailTransport(this.emailChannel);
  }

  getConnection(workspaceId: string, userId: string): EmailConnectionProductView {
    return toEmailConnectionView(
      this.notifications.getEmailConnection(workspaceId, userId),
      this.emailHonesty(),
    );
  }

  bind(workspaceId: string, userId: string, recipient: string): EmailConnectionProductView {
    return toEmailConnectionView(
      this.notifications.bindEmailRecipient({ workspaceId, userId, recipient }),
      this.emailHonesty(),
    );
  }

  disconnect(workspaceId: string, userId: string): EmailConnectionProductView {
    return toEmailConnectionView(
      this.notifications.disconnectEmail({ workspaceId, userId }),
      this.emailHonesty(),
    );
  }

  async sendTest(
    workspaceId: string,
    userId: string,
    actor?: Readonly<{ userId: string; role: Role }>,
  ): Promise<EmailTestProductView> {
    const delivery = await this.notifications.sendTestEmailNotification({
      workspaceId,
      userId,
      ...(actor ? { actorUserId: actor.userId, actorRole: actor.role } : {}),
    });
    return toEmailTestView({
      connection: this.notifications.getEmailConnection(workspaceId, userId),
      delivery,
      channels: this.notifications.listChannels(),
      honesty: this.emailHonesty(),
    });
  }

  getDiagnostics(workspaceId: string, userId: string): EmailDiagnosticsView {
    return toEmailDiagnosticsView({
      connection: this.notifications.getEmailConnection(workspaceId, userId),
      deliveries: this.notifications.listDeliveries({ workspaceId, userId }),
      honesty: this.emailHonesty(),
    });
  }
}
