import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformIntegrationAnchorState,
  type DurableNotificationPlatformIntegrationAnchor,
  type NotificationPlatformIntegrationAnchorPersistenceOutcome,
  type NotificationPlatformIntegrationAnchorState,
} from './domain/durable-notification-platform-integration-anchor';
import {
  NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_REPOSITORY,
  type NotificationPlatformIntegrationAnchorRepository,
} from './domain/notification-platform-integration-anchor.repository';

export type PersistNotificationPlatformIntegrationAnchorCommand = Readonly<{
  workspaceId: string;
  integrationAnchorId: string;
  platformIntegrationType: string;
  integrationState?: NotificationPlatformIntegrationAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N05-b — durable Notification Platform Integration anchor persistence on Notification Delivery owner.
 * Storage only — no platform integration I/O, restart recovery, or operational continuity.
 */
@Injectable()
export class NotificationPlatformIntegrationPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformIntegrationAnchorRepository,
  ) {}

  async loadAnchor(
    workspaceId: string,
    integrationAnchorId: string,
  ): Promise<DurableNotificationPlatformIntegrationAnchor | null> {
    return this.repository.loadNotificationPlatformIntegrationAnchor(
      workspaceId,
      integrationAnchorId,
    );
  }

  async persistIntegrationAnchor(
    command: PersistNotificationPlatformIntegrationAnchorCommand,
  ): Promise<NotificationPlatformIntegrationAnchorPersistenceOutcome> {
    const prior = await this.repository.loadNotificationPlatformIntegrationAnchor(
      command.workspaceId,
      command.integrationAnchorId,
    );
    const outcome = buildNotificationPlatformIntegrationAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformIntegrationAnchor(outcome.anchor);
    return outcome;
  }
}
