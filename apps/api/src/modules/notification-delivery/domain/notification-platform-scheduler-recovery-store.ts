import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformSchedulerAnchor } from './durable-notification-platform-scheduler-anchor';
import { sortNotificationPlatformSchedulerAnchorsDeterministically } from './notification-platform-scheduler-restart-recovery';

function compositeKey(workspaceId: string, schedulerAnchorId: string): string {
  return `${workspaceId}:${schedulerAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Scheduler anchors (W5-N12-c).
 * Not a second Source of Truth — hydrated from W5-N12-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformSchedulerRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableNotificationPlatformSchedulerAnchor>();

  replaceAll(anchors: readonly DurableNotificationPlatformSchedulerAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.schedulerAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformSchedulerAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.schedulerAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    schedulerAnchorId: string,
  ): DurableNotificationPlatformSchedulerAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, schedulerAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformSchedulerAnchor[] {
    return sortNotificationPlatformSchedulerAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
