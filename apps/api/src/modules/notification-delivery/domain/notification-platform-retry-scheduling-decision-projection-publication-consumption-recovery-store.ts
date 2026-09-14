import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor } from './durable-notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor';
import { sortNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorsDeterministically } from './notification-platform-retry-scheduling-decision-projection-publication-consumption-restart-recovery';

function compositeKey(workspaceId: string, consumptionAnchorId: string): string {
  return `${workspaceId}:${consumptionAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Retry Scheduling Decision Projection
 * Publication Consumption anchors (W5-N29-c). Not a second Source of Truth — hydrated from W5-N29-b
 * persistence on restart.
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
