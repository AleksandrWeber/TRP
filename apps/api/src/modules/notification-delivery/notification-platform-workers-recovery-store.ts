import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformWorkersAnchor } from './domain/durable-notification-platform-workers-anchor';
import { sortNotificationPlatformWorkersAnchorsDeterministically } from './domain/notification-platform-workers-restart-recovery';

function compositeKey(workspaceId: string, workersAnchorId: string): string {
  return `${workspaceId}:${workersAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Workers anchors (W5-N09-c).
 * Not a second Source of Truth — hydrated from W5-N09-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformWorkersRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableNotificationPlatformWorkersAnchor>();

  replaceAll(anchors: readonly DurableNotificationPlatformWorkersAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.workersAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformWorkersAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.workersAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    workersAnchorId: string,
  ): DurableNotificationPlatformWorkersAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, workersAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformWorkersAnchor[] {
    return sortNotificationPlatformWorkersAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
