import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformReliabilityAnchor } from './durable-notification-platform-reliability-anchor';
import { sortNotificationPlatformReliabilityAnchorsDeterministically } from './notification-platform-reliability-restart-recovery';

function compositeKey(workspaceId: string, reliabilityAnchorId: string): string {
  return `${workspaceId}:${reliabilityAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Delivery Reliability anchors (W5-N17-c).
 * Not a second Source of Truth — hydrated from W5-N17-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformReliabilityRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableNotificationPlatformReliabilityAnchor>();

  replaceAll(anchors: readonly DurableNotificationPlatformReliabilityAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.reliabilityAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformReliabilityAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.reliabilityAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    reliabilityAnchorId: string,
  ): DurableNotificationPlatformReliabilityAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, reliabilityAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformReliabilityAnchor[] {
    return sortNotificationPlatformReliabilityAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
