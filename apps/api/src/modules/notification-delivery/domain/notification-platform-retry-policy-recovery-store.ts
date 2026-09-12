import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetryPolicyAnchor } from './durable-notification-platform-retry-policy-anchor';
import { sortNotificationPlatformRetryPolicyAnchorsDeterministically } from './notification-platform-retry-policy-restart-recovery';

function compositeKey(workspaceId: string, retryPolicyAnchorId: string): string {
  return `${workspaceId}:${retryPolicyAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Retry Policy anchors (W5-N20-c).
 * Not a second Source of Truth — hydrated from W5-N20-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformRetryPolicyRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableNotificationPlatformRetryPolicyAnchor>();

  replaceAll(anchors: readonly DurableNotificationPlatformRetryPolicyAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.retryPolicyAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetryPolicyAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.retryPolicyAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    retryPolicyAnchorId: string,
  ): DurableNotificationPlatformRetryPolicyAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, retryPolicyAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetryPolicyAnchor[] {
    return sortNotificationPlatformRetryPolicyAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
