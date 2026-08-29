import { Inject, Injectable } from '@nestjs/common';
import {
  buildPushNotificationAnchorState,
  type DurablePushNotificationAnchor,
  type PushNotificationAnchorDeliveryState,
  type PushNotificationAnchorPersistenceOutcome,
} from './domain/durable-push-notification-anchor';
import {
  PUSH_NOTIFICATION_ANCHOR_REPOSITORY,
  type PushNotificationAnchorRepository,
} from './domain/push-notification-anchor.repository';
import { PushNotificationRecoveryStore } from './push-notification-recovery-store';

export type PersistPushNotificationAnchorCommand = Readonly<{
  workspaceId: string;
  notificationId: string;
  notificationChannel: string;
  notificationType: string;
  recipientIdentifier?: string | null;
  templateIdentifier?: string | null;
  deliveryState?: PushNotificationAnchorDeliveryState;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N04-b/c — durable Push notification anchor persistence on Notification Delivery owner.
 * W5-N04-c — write-through to recovery store after hydrate.
 * Storage only — no Web Push/FCM I/O, outbound delivery, or operational continuity.
 */
@Injectable()
export class PushNotificationPersistenceService {
  constructor(
    @Inject(PUSH_NOTIFICATION_ANCHOR_REPOSITORY)
    private readonly repository: PushNotificationAnchorRepository,
    @Inject(PushNotificationRecoveryStore)
    private readonly recoveryStore: PushNotificationRecoveryStore,
  ) {}

  async loadAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurablePushNotificationAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, notificationId);
    }
    return this.repository.loadPushNotificationAnchor(workspaceId, notificationId);
  }

  async persistNotificationAnchor(
    command: PersistPushNotificationAnchorCommand,
  ): Promise<PushNotificationAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.notificationId);
    const outcome = buildPushNotificationAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.savePushNotificationAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
