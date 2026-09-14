import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor } from './durable-notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor';

function compositeKey(workspaceId: string, consumptionAnchorId: string): string {
  return `${workspaceId}:${consumptionAnchorId}`;
}

export function sortNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
      if (workspaceCompare !== 0) {
        return workspaceCompare;
      }
      return a.consumptionAnchorId.localeCompare(b.consumptionAnchorId);
    }),
  );
}

/**
 * In-memory write-through cache for Notification Platform Retry Scheduling Decision Projection
 * Publication Consumption anchors (W5-N29-b persistence foundation).
 * Not a second Source of Truth. Full restart hydrate orchestration is W5-N29-c — not implemented here.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor
  >();

  replaceAll(
    anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[],
  ): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.consumptionAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(
    anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor,
  ): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.consumptionAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    consumptionAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, consumptionAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[] {
    return sortNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorsDeterministically(
      [...this.byCompositeKey.values()],
    );
  }
}
