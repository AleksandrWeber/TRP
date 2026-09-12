import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionAnchor } from './durable-notification-platform-retry-scheduling-decision-anchor';
import { sortNotificationPlatformRetrySchedulingDecisionAnchorsDeterministically } from './notification-platform-retry-scheduling-decision-restart-recovery';

function compositeKey(workspaceId: string, decisionAnchorId: string): string {
  return `${workspaceId}:${decisionAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Retry Scheduling Decision anchors
 * (W5-N25-c). Not a second Source of Truth — hydrated from W5-N25-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformRetrySchedulingDecisionAnchor
  >();

  replaceAll(anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.decisionAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetrySchedulingDecisionAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.decisionAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    decisionAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingDecisionAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, decisionAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[] {
    return sortNotificationPlatformRetrySchedulingDecisionAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
