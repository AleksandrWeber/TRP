import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor } from './durable-notification-platform-retry-scheduling-decision-projection-publication-anchor';
import { sortNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorsDeterministically } from './notification-platform-retry-scheduling-decision-projection-publication-restart-recovery';

function compositeKey(workspaceId: string, publicationAnchorId: string): string {
  return `${workspaceId}:${publicationAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Retry Scheduling Decision Projection
 * Publication anchors (W5-N28-c). Not a second Source of Truth — hydrated from W5-N28-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor
  >();

  replaceAll(
    anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[],
  ): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.publicationAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.publicationAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    publicationAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, publicationAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[] {
    return sortNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorsDeterministically(
      [...this.byCompositeKey.values()],
    );
  }
}
