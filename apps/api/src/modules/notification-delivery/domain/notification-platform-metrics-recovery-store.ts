import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformMetricsAnchor } from './durable-notification-platform-metrics-anchor';
import { sortNotificationPlatformMetricsAnchorsDeterministically } from './notification-platform-metrics-restart-recovery';

function compositeKey(workspaceId: string, metricsAnchorId: string): string {
  return `${workspaceId}:${metricsAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Metrics anchors (W5-N16-c).
 * Not a second Source of Truth — hydrated from W5-N16-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformMetricsRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableNotificationPlatformMetricsAnchor>();

  replaceAll(anchors: readonly DurableNotificationPlatformMetricsAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.metricsAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformMetricsAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.metricsAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    metricsAnchorId: string,
  ): DurableNotificationPlatformMetricsAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, metricsAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformMetricsAnchor[] {
    return sortNotificationPlatformMetricsAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
