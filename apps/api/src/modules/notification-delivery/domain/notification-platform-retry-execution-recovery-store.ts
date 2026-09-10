import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetryExecutionAnchor } from './durable-notification-platform-retry-execution-anchor';
import { sortNotificationPlatformRetryExecutionAnchorsDeterministically } from './notification-platform-retry-execution-restart-recovery';

function compositeKey(workspaceId: string, retryExecutionAnchorId: string): string {
  return `${workspaceId}:${retryExecutionAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Retry Execution anchors (W5-N18-c).
 * Not a second Source of Truth — hydrated from W5-N18-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformRetryExecutionRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformRetryExecutionAnchor
  >();

  replaceAll(anchors: readonly DurableNotificationPlatformRetryExecutionAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(
        compositeKey(anchor.workspaceId, anchor.retryExecutionAnchorId),
        anchor,
      );
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetryExecutionAnchor): void {
    this.byCompositeKey.set(
      compositeKey(anchor.workspaceId, anchor.retryExecutionAnchorId),
      anchor,
    );
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    retryExecutionAnchorId: string,
  ): DurableNotificationPlatformRetryExecutionAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, retryExecutionAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetryExecutionAnchor[] {
    return sortNotificationPlatformRetryExecutionAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
