import { Injectable } from '@nestjs/common';
import type { DurablePushNotificationAnchor } from './domain/durable-push-notification-anchor';
import { sortPushNotificationAnchorsDeterministically } from './domain/push-notification-restart-recovery';

function compositeKey(workspaceId: string, notificationId: string): string {
  return `${workspaceId}:${notificationId}`;
}

/**
 * In-memory runtime cache for recovered Push notification anchors (W5-N04-c).
 * Not a second Source of Truth — hydrated from W5-N04-b persistence on restart.
 */
@Injectable()
export class PushNotificationRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurablePushNotificationAnchor>();

  replaceAll(anchors: readonly DurablePushNotificationAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.notificationId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurablePushNotificationAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.notificationId), anchor);
    this.hydrated = true;
  }

  get(workspaceId: string, notificationId: string): DurablePushNotificationAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, notificationId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurablePushNotificationAnchor[] {
    return sortPushNotificationAnchorsDeterministically([...this.byCompositeKey.values()]);
  }
}
