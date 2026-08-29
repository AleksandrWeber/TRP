import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformQueueAnchor } from './domain/durable-notification-platform-queue-anchor';
import { sortNotificationPlatformQueueAnchorsDeterministically } from './domain/notification-platform-queue-restart-recovery';

function compositeKey(workspaceId: string, queueAnchorId: string): string {
  return `${workspaceId}:${queueAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Queue anchors (W5-N08-c).
 * Not a second Source of Truth — hydrated from W5-N08-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformQueueRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableNotificationPlatformQueueAnchor>();

  replaceAll(anchors: readonly DurableNotificationPlatformQueueAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.queueAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformQueueAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.queueAnchorId), anchor);
    this.hydrated = true;
  }

  get(workspaceId: string, queueAnchorId: string): DurableNotificationPlatformQueueAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, queueAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformQueueAnchor[] {
    return sortNotificationPlatformQueueAnchorsDeterministically([...this.byCompositeKey.values()]);
  }
}
