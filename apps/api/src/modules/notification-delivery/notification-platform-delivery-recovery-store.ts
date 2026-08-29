import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformDeliveryAnchor } from './domain/durable-notification-platform-delivery-anchor';
import { sortNotificationPlatformDeliveryAnchorsDeterministically } from './domain/notification-platform-delivery-restart-recovery';

function compositeKey(workspaceId: string, deliveryAnchorId: string): string {
  return `${workspaceId}:${deliveryAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Delivery anchors (W5-N06-c).
 * Not a second Source of Truth — hydrated from W5-N06-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformDeliveryRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableNotificationPlatformDeliveryAnchor>();

  replaceAll(anchors: readonly DurableNotificationPlatformDeliveryAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.deliveryAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformDeliveryAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.deliveryAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    deliveryAnchorId: string,
  ): DurableNotificationPlatformDeliveryAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, deliveryAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformDeliveryAnchor[] {
    return sortNotificationPlatformDeliveryAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
