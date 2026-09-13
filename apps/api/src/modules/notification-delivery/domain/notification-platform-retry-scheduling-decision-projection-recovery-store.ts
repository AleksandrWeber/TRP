import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor } from './durable-notification-platform-retry-scheduling-decision-projection-anchor';

function compositeKey(workspaceId: string, projectionAnchorId: string): string {
  return `${workspaceId}:${projectionAnchorId}`;
}

export function sortNotificationPlatformRetrySchedulingDecisionProjectionAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
      if (workspaceCompare !== 0) {
        return workspaceCompare;
      }
      return a.projectionAnchorId.localeCompare(b.projectionAnchorId);
    }),
  );
}

/**
 * In-memory write-through cache for Notification Platform Retry Scheduling Decision Projection
 * anchors (W5-N27-b). Not a second Source of Truth — hydrated from persistence on write-through.
 * Full restart hydrate is W5-N27-c.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor
  >();

  replaceAll(
    anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[],
  ): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.projectionAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.projectionAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    projectionAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, projectionAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[] {
    return sortNotificationPlatformRetrySchedulingDecisionProjectionAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
