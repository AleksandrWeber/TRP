import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor } from './durable-notification-platform-retry-scheduling-decision-projection-anchor';
import { sortNotificationPlatformRetrySchedulingDecisionProjectionAnchorsDeterministically } from './notification-platform-retry-scheduling-decision-projection-restart-recovery';

function compositeKey(workspaceId: string, projectionAnchorId: string): string {
  return `${workspaceId}:${projectionAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Retry Scheduling Decision Projection
 * anchors (W5-N27-c). Not a second Source of Truth — hydrated from W5-N27-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor
  >();

  replaceAll(
    anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[],
  ): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.projectionAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.projectionAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    projectionAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, projectionAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[] {
    return sortNotificationPlatformRetrySchedulingDecisionProjectionAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
