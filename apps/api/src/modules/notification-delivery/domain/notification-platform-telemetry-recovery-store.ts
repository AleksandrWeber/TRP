import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformTelemetryAnchor } from './durable-notification-platform-telemetry-anchor';
import { sortNotificationPlatformTelemetryAnchorsDeterministically } from './notification-platform-telemetry-restart-recovery';

function compositeKey(workspaceId: string, telemetryAnchorId: string): string {
  return `${workspaceId}:${telemetryAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Telemetry anchors (W5-N15-c).
 * Not a second Source of Truth — hydrated from W5-N15-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformTelemetryRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableNotificationPlatformTelemetryAnchor>();

  replaceAll(anchors: readonly DurableNotificationPlatformTelemetryAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.telemetryAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformTelemetryAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.telemetryAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    telemetryAnchorId: string,
  ): DurableNotificationPlatformTelemetryAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, telemetryAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformTelemetryAnchor[] {
    return sortNotificationPlatformTelemetryAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
