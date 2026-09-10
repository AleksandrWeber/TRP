import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingAnchor } from './durable-notification-platform-retry-scheduling-anchor';
import { sortNotificationPlatformRetrySchedulingAnchorsDeterministically } from './notification-platform-retry-scheduling-restart-recovery';

function compositeKey(workspaceId: string, retrySchedulingAnchorId: string): string {
  return `${workspaceId}:${retrySchedulingAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Retry Scheduling anchors (W5-N19-c).
 * Not a second Source of Truth — hydrated from W5-N19-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformRetrySchedulingAnchor
  >();

  replaceAll(anchors: readonly DurableNotificationPlatformRetrySchedulingAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(
        compositeKey(anchor.workspaceId, anchor.retrySchedulingAnchorId),
        anchor,
      );
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetrySchedulingAnchor): void {
    this.byCompositeKey.set(
      compositeKey(anchor.workspaceId, anchor.retrySchedulingAnchorId),
      anchor,
    );
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    retrySchedulingAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, retrySchedulingAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetrySchedulingAnchor[] {
    return sortNotificationPlatformRetrySchedulingAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
