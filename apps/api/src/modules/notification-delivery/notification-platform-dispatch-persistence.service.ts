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
 * W5-N07-b — durable Notification Platform Dispatch anchor persistence on Notification Delivery owner.
 * Storage only — no dispatch execution, dispatcher, queue workers, retry, scheduler,
 * restart recovery, or operational continuity.
 */
@Injectable()
export class NotificationPlatformDispatchPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformDispatchAnchorRepository,
  ) {}

  async loadAnchor(
    workspaceId: string,
    dispatchAnchorId: string,
  ): Promise<DurableNotificationPlatformDispatchAnchor | null> {
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
    return outcome;
  }
}
