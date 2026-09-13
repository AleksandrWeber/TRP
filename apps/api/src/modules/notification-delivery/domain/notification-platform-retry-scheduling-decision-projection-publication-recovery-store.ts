import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor } from './durable-notification-platform-retry-scheduling-decision-projection-publication-anchor';

function compositeKey(workspaceId: string, publicationAnchorId: string): string {
  return `${workspaceId}:${publicationAnchorId}`;
}

export function sortNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
      if (workspaceCompare !== 0) {
        return workspaceCompare;
      }
      return a.publicationAnchorId.localeCompare(b.publicationAnchorId);
    }),
  );
}

/**
 * In-memory write-through cache for Notification Platform Retry Scheduling Decision Projection Publication
 * anchors (W5-N28-b). Not a second Source of Truth — full restart hydrate is W5-N28-c.
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
