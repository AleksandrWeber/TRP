/**
 * PC-07 — product adapter over existing NotificationServicePort Push methods.
 *
 * Delegates bind / subscriptions / test / disconnect / status.
 * VAPID private material stays in Vault via Connections.
 * Notification Delivery remains owner. Push remains delivery-only.
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../identity/role';
import { projectPushTransport } from '../notification-delivery/domain/push-transport-projection';
import {
  NOTIFICATION_SERVICE_PORT,
  PUSH_CHANNEL_ADAPTER,
  type NotificationChannelPort,
  type NotificationServicePort,
} from '../notification-delivery/ports/notification.port';
import {
  toPushConnectionView,
  toPushDiagnosticsView,
  toPushSubscriptionView,
  toPushTestView,
  type PushConnectionProductView,
  type PushDiagnosticsView,
  type PushSubscriptionProductView,
  type PushTestProductView,
  type PushVapidPublicKeyView,
} from './push.view';

@Injectable()
export class PushProductService {
  constructor(
    @Inject(NOTIFICATION_SERVICE_PORT)
    private readonly notifications: NotificationServicePort,
    @Inject(PUSH_CHANNEL_ADAPTER)
    private readonly pushChannel: NotificationChannelPort,
  ) {}

  private pushHonesty() {
    return projectPushTransport(this.pushChannel);
  }

  getConnection(workspaceId: string, userId: string): PushConnectionProductView {
    return toPushConnectionView(
      this.notifications.getPushConnection(workspaceId, userId),
      this.pushHonesty(),
    );
  }

  async bind(
    workspaceId: string,
    userId: string,
    actor?: Readonly<{ userId: string; role: Role }>,
  ): Promise<PushConnectionProductView> {
    return toPushConnectionView(
      await this.notifications.bindPushChannel({
        workspaceId,
        userId,
        ...(actor ? { actorUserId: actor.userId, actorRole: actor.role } : {}),
      }),
      this.pushHonesty(),
    );
  }

  async disconnect(workspaceId: string, userId: string): Promise<PushConnectionProductView> {
    return toPushConnectionView(
      await this.notifications.disconnectPush({ workspaceId, userId }),
      this.pushHonesty(),
    );
  }

  async sendTest(
    workspaceId: string,
    userId: string,
    actor?: Readonly<{ userId: string; role: Role }>,
  ): Promise<PushTestProductView> {
    const delivery = await this.notifications.sendTestPushNotification({
      workspaceId,
      userId,
      ...(actor ? { actorUserId: actor.userId, actorRole: actor.role } : {}),
    });
    return toPushTestView({
      connection: this.notifications.getPushConnection(workspaceId, userId),
      delivery,
      channels: this.notifications.listChannels(),
      honesty: this.pushHonesty(),
    });
  }

  async registerSubscription(
    workspaceId: string,
    userId: string,
    body: Readonly<{
      endpoint: string;
      keys: Readonly<{ p256dh: string; auth: string }>;
      expirationTime?: number | null;
    }>,
    userAgent?: string,
  ): Promise<PushSubscriptionProductView> {
    const saved = await this.notifications.registerPushSubscription({
      workspaceId,
      userId,
      endpoint: body.endpoint,
      keys: body.keys,
      ...(body.expirationTime !== undefined ? { expirationTime: body.expirationTime } : {}),
      ...(userAgent ? { userAgent } : {}),
    });
    return toPushSubscriptionView(saved);
  }

  async revokeSubscription(
    workspaceId: string,
    userId: string,
    subscriptionId: string,
  ): Promise<PushSubscriptionProductView | null> {
    const revoked = await this.notifications.revokePushSubscription({
      workspaceId,
      userId,
      subscriptionId,
    });
    return revoked ? toPushSubscriptionView(revoked) : null;
  }

  async getVapidPublicKey(
    workspaceId: string,
    actor: Readonly<{ userId: string; role: Role }>,
  ): Promise<PushVapidPublicKeyView> {
    const publicKey = await this.notifications.getPushVapidPublicKey({
      workspaceId,
      actorUserId: actor.userId,
      actorRole: actor.role,
    });
    if (!publicKey) {
      throw new Error('Web Push VAPID is not configured');
    }
    return {
      publicKey,
      controlPlane: false,
      authorityClass: 'notification-projection',
    };
  }

  async getDiagnostics(workspaceId: string, userId: string): Promise<PushDiagnosticsView> {
    const subscriptions = await this.notifications.listPushSubscriptions(workspaceId, userId);
    return toPushDiagnosticsView({
      connection: this.notifications.getPushConnection(workspaceId, userId),
      deliveries: this.notifications.listDeliveries({ workspaceId, userId }),
      honesty: this.pushHonesty(),
      activeSubscriptionCount: subscriptions.length,
    });
  }
}
