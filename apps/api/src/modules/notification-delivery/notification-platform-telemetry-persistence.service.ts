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
 * W5-N15-b — durable Notification Platform Telemetry anchor persistence on Notification Delivery owner.
 * Storage only — no metrics collection, exporters, dashboards, runtime aggregation,
 * recovery store, restart recovery, or operational continuity.
 */
@Injectable()
export class NotificationPlatformTelemetryPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformTelemetryAnchorRepository,
  ) {}

  async loadAnchor(
    workspaceId: string,
    telemetryAnchorId: string,
  ): Promise<DurableNotificationPlatformTelemetryAnchor | null> {
    return this.repository.loadNotificationPlatformTelemetryAnchor(workspaceId, telemetryAnchorId);
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
    return outcome;
  }
}
