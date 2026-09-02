import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformTelemetryAnchorState,
  type DurableNotificationPlatformTelemetryAnchor,
  type NotificationPlatformTelemetryAnchorPersistenceOutcome,
  type NotificationPlatformTelemetryAnchorState,
} from './domain/durable-notification-platform-telemetry-anchor';
import {
  NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_REPOSITORY,
  type NotificationPlatformTelemetryAnchorRepository,
} from './domain/notification-platform-telemetry-anchor.repository';
import { NotificationPlatformTelemetryRecoveryStore } from './domain/notification-platform-telemetry-recovery-store';

export type PersistNotificationPlatformTelemetryAnchorCommand = Readonly<{
  workspaceId: string;
  telemetryAnchorId: string;
  platformTelemetryType: string;
  telemetryState?: NotificationPlatformTelemetryAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N15-b/c — durable Notification Platform Telemetry anchor persistence on Notification Delivery owner.
 * W5-N15-c — write-through to recovery store after hydrate.
 * Storage only — no metrics collection, exporters, dashboards, runtime aggregation,
 * or operational continuity.
 */
@Injectable()
export class NotificationPlatformTelemetryPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformTelemetryAnchorRepository,
    @Inject(NotificationPlatformTelemetryRecoveryStore)
    private readonly recoveryStore: NotificationPlatformTelemetryRecoveryStore,
  ) {}

  async loadAnchor(
    workspaceId: string,
    telemetryAnchorId: string,
  ): Promise<DurableNotificationPlatformTelemetryAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, telemetryAnchorId);
    }
    return this.repository.loadNotificationPlatformTelemetryAnchor(workspaceId, telemetryAnchorId);
  }

  async listAllNotificationPlatformTelemetryAnchors(): Promise<
    readonly DurableNotificationPlatformTelemetryAnchor[]
  > {
    return this.repository.listAllNotificationPlatformTelemetryAnchors();
  }

  async persistTelemetryAnchor(
    command: PersistNotificationPlatformTelemetryAnchorCommand,
  ): Promise<NotificationPlatformTelemetryAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.telemetryAnchorId);
    const outcome = buildNotificationPlatformTelemetryAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformTelemetryAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
