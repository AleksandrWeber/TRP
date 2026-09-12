import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetryEligibilityAnchor } from './durable-notification-platform-retry-eligibility-anchor';
import { sortNotificationPlatformRetryEligibilityAnchorsDeterministically } from './notification-platform-retry-eligibility-restart-recovery';

function compositeKey(workspaceId: string, eligibilityAnchorId: string): string {
  return `${workspaceId}:${eligibilityAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Retry Eligibility anchors
 * (W5-N23-c). Not a second Source of Truth — hydrated from W5-N23-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformRetryEligibilityRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformRetryEligibilityAnchor
  >();

  replaceAll(anchors: readonly DurableNotificationPlatformRetryEligibilityAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.eligibilityAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetryEligibilityAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.eligibilityAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    eligibilityAnchorId: string,
  ): DurableNotificationPlatformRetryEligibilityAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, eligibilityAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetryEligibilityAnchor[] {
    return sortNotificationPlatformRetryEligibilityAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
