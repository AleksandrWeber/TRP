import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetryBackoffAnchor } from './durable-notification-platform-retry-backoff-anchor';

function compositeKey(workspaceId: string, retryBackoffAnchorId: string): string {
  return `${workspaceId}:${retryBackoffAnchorId}`;
}

function sortNotificationPlatformRetryBackoffAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetryBackoffAnchor[],
): readonly DurableNotificationPlatformRetryBackoffAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.retryBackoffAnchorId.localeCompare(b.retryBackoffAnchorId);
    }),
  );
}

/**
 * In-memory runtime cache for recovered Notification Platform Retry Backoff anchors (W5-N21-c).
 * Not a second Source of Truth — hydrated from W5-N21-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformRetryBackoffRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformRetryBackoffAnchor
  >();

  replaceAll(anchors: readonly DurableNotificationPlatformRetryBackoffAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(
        compositeKey(anchor.workspaceId, anchor.retryBackoffAnchorId),
        anchor,
      );
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetryBackoffAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.retryBackoffAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    retryBackoffAnchorId: string,
  ): DurableNotificationPlatformRetryBackoffAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, retryBackoffAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetryBackoffAnchor[] {
    return sortNotificationPlatformRetryBackoffAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
