import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformDispatchAnchor } from './domain/durable-notification-platform-dispatch-anchor';
import { sortNotificationPlatformDispatchAnchorsDeterministically } from './domain/notification-platform-dispatch-restart-recovery';

function compositeKey(workspaceId: string, dispatchAnchorId: string): string {
  return `${workspaceId}:${dispatchAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Dispatch anchors (W5-N07-c).
 * Not a second Source of Truth — hydrated from W5-N07-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformDispatchRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableNotificationPlatformDispatchAnchor>();

  replaceAll(anchors: readonly DurableNotificationPlatformDispatchAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.dispatchAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformDispatchAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.dispatchAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    dispatchAnchorId: string,
  ): DurableNotificationPlatformDispatchAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, dispatchAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformDispatchAnchor[] {
    return sortNotificationPlatformDispatchAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
