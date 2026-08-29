import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformWorkerExecutionAnchor } from './domain/durable-notification-platform-worker-execution-anchor';
import { sortNotificationPlatformWorkerExecutionAnchorsDeterministically } from './domain/notification-platform-worker-execution-restart-recovery';

function compositeKey(workspaceId: string, workerExecutionAnchorId: string): string {
  return `${workspaceId}:${workerExecutionAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Worker Execution anchors (W5-N10-c).
 * Not a second Source of Truth — hydrated from W5-N10-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformWorkerExecutionRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformWorkerExecutionAnchor
  >();

  replaceAll(anchors: readonly DurableNotificationPlatformWorkerExecutionAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(
        compositeKey(anchor.workspaceId, anchor.workerExecutionAnchorId),
        anchor,
      );
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformWorkerExecutionAnchor): void {
    this.byCompositeKey.set(
      compositeKey(anchor.workspaceId, anchor.workerExecutionAnchorId),
      anchor,
    );
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    workerExecutionAnchorId: string,
  ): DurableNotificationPlatformWorkerExecutionAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, workerExecutionAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformWorkerExecutionAnchor[] {
    return sortNotificationPlatformWorkerExecutionAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
