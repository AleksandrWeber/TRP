import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformDispatchAnchorState,
  type DurableNotificationPlatformDispatchAnchor,
  type NotificationPlatformDispatchAnchorPersistenceOutcome,
  type NotificationPlatformDispatchAnchorState,
} from './domain/durable-notification-platform-dispatch-anchor';
import {
  NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_REPOSITORY,
  type NotificationPlatformDispatchAnchorRepository,
} from './domain/notification-platform-dispatch-anchor.repository';
import { NotificationPlatformDispatchRecoveryStore } from './notification-platform-dispatch-recovery-store';

export type PersistNotificationPlatformDispatchAnchorCommand = Readonly<{
  workspaceId: string;
  dispatchAnchorId: string;
  platformDispatchType: string;
  dispatchState?: NotificationPlatformDispatchAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N07-b/c — durable Notification Platform Dispatch anchor persistence on Notification Delivery owner.
 * W5-N07-c — write-through to recovery store after hydrate.
 * Storage only — no dispatch execution, dispatcher, queue workers, retry, scheduler, or operational continuity.
 */
@Injectable()
export class NotificationPlatformDispatchPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformDispatchAnchorRepository,
    @Inject(NotificationPlatformDispatchRecoveryStore)
    private readonly recoveryStore: NotificationPlatformDispatchRecoveryStore,
  ) {}

  async loadAnchor(
    workspaceId: string,
    dispatchAnchorId: string,
  ): Promise<DurableNotificationPlatformDispatchAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, dispatchAnchorId);
    }
    return this.repository.loadNotificationPlatformDispatchAnchor(workspaceId, dispatchAnchorId);
  }

  async persistDispatchAnchor(
    command: PersistNotificationPlatformDispatchAnchorCommand,
  ): Promise<NotificationPlatformDispatchAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.dispatchAnchorId);
    const outcome = buildNotificationPlatformDispatchAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformDispatchAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
