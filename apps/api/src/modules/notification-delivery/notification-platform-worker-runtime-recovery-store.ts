import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformWorkerRuntimeAnchor } from './domain/durable-notification-platform-worker-runtime-anchor';
import { sortNotificationPlatformWorkerRuntimeAnchorsDeterministically } from './domain/notification-platform-worker-runtime-restart-recovery';

function compositeKey(workspaceId: string, workerRuntimeAnchorId: string): string {
  return `${workspaceId}:${workerRuntimeAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Worker Runtime anchors (W5-N11-c).
 * Not a second Source of Truth — hydrated from W5-N11-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformWorkerRuntimeRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformWorkerRuntimeAnchor
  >();

  replaceAll(anchors: readonly DurableNotificationPlatformWorkerRuntimeAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(
        compositeKey(anchor.workspaceId, anchor.workerRuntimeAnchorId),
        anchor,
      );
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformWorkerRuntimeAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.workerRuntimeAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    workerRuntimeAnchorId: string,
  ): DurableNotificationPlatformWorkerRuntimeAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, workerRuntimeAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformWorkerRuntimeAnchor[] {
    return sortNotificationPlatformWorkerRuntimeAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
