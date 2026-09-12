import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionAnchor } from './durable-notification-platform-retry-scheduling-decision-anchor';

function compositeKey(workspaceId: string, decisionAnchorId: string): string {
  return `${workspaceId}:${decisionAnchorId}`;
}

function sortDecisionAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
      if (workspaceCompare !== 0) {
        return workspaceCompare;
      }
      return a.decisionAnchorId.localeCompare(b.decisionAnchorId);
    }),
  );
}

/**
 * In-memory write-through cache for Notification Platform Retry Scheduling Decision anchors.
 * Write-through from W5-N25-b persistence only — full restart hydrate is W5-N25-c.
 * Not a second Source of Truth.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformRetrySchedulingDecisionAnchor
  >();

  replaceAll(anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.decisionAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetrySchedulingDecisionAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.decisionAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    decisionAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingDecisionAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, decisionAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[] {
    return sortDecisionAnchorsDeterministically([...this.byCompositeKey.values()]);
  }
}
