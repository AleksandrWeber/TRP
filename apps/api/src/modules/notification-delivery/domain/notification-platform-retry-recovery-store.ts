import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetryAnchor } from './durable-notification-platform-retry-anchor';
import { sortNotificationPlatformRetryAnchorsDeterministically } from './notification-platform-retry-restart-recovery';

function compositeKey(workspaceId: string, retryAnchorId: string): string {
  return `${workspaceId}:${retryAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Retry anchors (W5-N13-c).
 * Not a second Source of Truth — hydrated from W5-N13-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformRetryRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableNotificationPlatformRetryAnchor>();

  replaceAll(anchors: readonly DurableNotificationPlatformRetryAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.retryAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetryAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.retryAnchorId), anchor);
    this.hydrated = true;
  }

  get(workspaceId: string, retryAnchorId: string): DurableNotificationPlatformRetryAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, retryAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetryAnchor[] {
    return sortNotificationPlatformRetryAnchorsDeterministically([...this.byCompositeKey.values()]);
  }
}
