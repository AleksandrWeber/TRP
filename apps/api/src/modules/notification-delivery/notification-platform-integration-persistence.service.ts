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
import { NotificationPlatformIntegrationRecoveryStore } from './notification-platform-integration-recovery-store';

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
 * W5-N05-b/c — durable Notification Platform Integration anchor persistence on Notification Delivery owner.
 * W5-N05-c — write-through to recovery store after hydrate.
 * Storage only — no platform integration I/O or operational continuity.
 */
@Injectable()
export class NotificationPlatformIntegrationPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformIntegrationAnchorRepository,
    @Inject(NotificationPlatformIntegrationRecoveryStore)
    private readonly recoveryStore: NotificationPlatformIntegrationRecoveryStore,
  ) {}

  async loadAnchor(
    workspaceId: string,
    integrationAnchorId: string,
  ): Promise<DurableNotificationPlatformIntegrationAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, integrationAnchorId);
    }
    return this.repository.loadNotificationPlatformIntegrationAnchor(
      workspaceId,
      integrationAnchorId,
    );
  }

  async persistIntegrationAnchor(
    command: PersistNotificationPlatformIntegrationAnchorCommand,
  ): Promise<NotificationPlatformIntegrationAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.integrationAnchorId);
    const outcome = buildNotificationPlatformIntegrationAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformIntegrationAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
