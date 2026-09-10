import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingAnchor } from './durable-notification-platform-retry-scheduling-anchor';

function compositeKey(workspaceId: string, retrySchedulingAnchorId: string): string {
  return `${workspaceId}:${retrySchedulingAnchorId}`;
}

function sortNotificationPlatformRetrySchedulingAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetrySchedulingAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
      if (workspaceCompare !== 0) {
        return workspaceCompare;
      }
      return a.retrySchedulingAnchorId.localeCompare(b.retrySchedulingAnchorId);
    }),
  );
}

/**
 * In-memory runtime cache for recovered Notification Platform Retry Scheduling anchors.
 * Write-through prep in W5-N19-b. Hydrate/replaceAll on restart is W5-N19-c.
 * Not a second Source of Truth — durable SoT remains Prisma persistence.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformRetrySchedulingAnchor
  >();

  replaceAll(anchors: readonly DurableNotificationPlatformRetrySchedulingAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(
        compositeKey(anchor.workspaceId, anchor.retrySchedulingAnchorId),
        anchor,
      );
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetrySchedulingAnchor): void {
    this.byCompositeKey.set(
      compositeKey(anchor.workspaceId, anchor.retrySchedulingAnchorId),
      anchor,
    );
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    retrySchedulingAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, retrySchedulingAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetrySchedulingAnchor[] {
    return sortNotificationPlatformRetrySchedulingAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
