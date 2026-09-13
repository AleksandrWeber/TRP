import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor } from './durable-notification-platform-retry-scheduling-decision-evaluation-anchor';

function compositeKey(workspaceId: string, evaluationAnchorId: string): string {
  return `${workspaceId}:${evaluationAnchorId}`;
}

function sortEvaluationAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
      if (workspaceCompare !== 0) {
        return workspaceCompare;
      }
      return a.evaluationAnchorId.localeCompare(b.evaluationAnchorId);
    }),
  );
}

/**
 * In-memory runtime cache for Notification Platform Retry Scheduling Decision Evaluation anchors
 * (write-through from W5-N26-b). Full restart hydrate is W5-N26-c.
 * Not a second Source of Truth.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor
  >();

  replaceAll(
    anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[],
  ): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.evaluationAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.evaluationAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    evaluationAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, evaluationAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[] {
    return sortEvaluationAnchorsDeterministically([...this.byCompositeKey.values()]);
  }
}
