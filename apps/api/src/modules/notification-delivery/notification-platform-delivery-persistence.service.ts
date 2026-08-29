import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformDeliveryAnchorState,
  type DurableNotificationPlatformDeliveryAnchor,
  type NotificationPlatformDeliveryAnchorPersistenceOutcome,
  type NotificationPlatformDeliveryAnchorState,
} from './domain/durable-notification-platform-delivery-anchor';
import {
  NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_REPOSITORY,
  type NotificationPlatformDeliveryAnchorRepository,
} from './domain/notification-platform-delivery-anchor.repository';
import { NotificationPlatformDeliveryRecoveryStore } from './notification-platform-delivery-recovery-store';

export type PersistNotificationPlatformDeliveryAnchorCommand = Readonly<{
  workspaceId: string;
  deliveryAnchorId: string;
  platformDeliveryType: string;
  deliveryState?: NotificationPlatformDeliveryAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N06-b/c — durable Notification Platform Delivery anchor persistence on Notification Delivery owner.
 * W5-N06-c — write-through to recovery store after hydrate.
 * Storage only — no delivery execution, dispatcher, queue workers, retry, scheduler, or operational continuity.
 */
@Injectable()
export class NotificationPlatformDeliveryPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformDeliveryAnchorRepository,
    @Inject(NotificationPlatformDeliveryRecoveryStore)
    private readonly recoveryStore: NotificationPlatformDeliveryRecoveryStore,
  ) {}

  async loadAnchor(
    workspaceId: string,
    deliveryAnchorId: string,
  ): Promise<DurableNotificationPlatformDeliveryAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, deliveryAnchorId);
    }
    return this.repository.loadNotificationPlatformDeliveryAnchor(workspaceId, deliveryAnchorId);
  }

  async persistDeliveryAnchor(
    command: PersistNotificationPlatformDeliveryAnchorCommand,
  ): Promise<NotificationPlatformDeliveryAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.deliveryAnchorId);
    const outcome = buildNotificationPlatformDeliveryAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformDeliveryAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
