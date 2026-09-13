import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor } from './durable-notification-platform-retry-scheduling-decision-evaluation-anchor';
import { sortNotificationPlatformRetrySchedulingDecisionEvaluationAnchorsDeterministically } from './notification-platform-retry-scheduling-decision-evaluation-restart-recovery';

function compositeKey(workspaceId: string, evaluationAnchorId: string): string {
  return `${workspaceId}:${evaluationAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Retry Scheduling Decision Evaluation
 * anchors (W5-N26-c). Not a second Source of Truth — hydrated from W5-N26-b persistence on restart.
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
    return sortNotificationPlatformRetrySchedulingDecisionEvaluationAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
