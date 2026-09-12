import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformRetryBackoffCalculationAnchor } from './durable-notification-platform-retry-backoff-calculation-anchor';
import { sortNotificationPlatformRetryBackoffCalculationAnchorsDeterministically } from './notification-platform-retry-backoff-calculation-restart-recovery';

function compositeKey(workspaceId: string, calculationAnchorId: string): string {
  return `${workspaceId}:${calculationAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Retry Backoff Calculation anchors
 * (W5-N22-c). Not a second Source of Truth — hydrated from W5-N22-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformRetryBackoffCalculationRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<
    string,
    DurableNotificationPlatformRetryBackoffCalculationAnchor
  >();

  replaceAll(anchors: readonly DurableNotificationPlatformRetryBackoffCalculationAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.calculationAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformRetryBackoffCalculationAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.calculationAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    calculationAnchorId: string,
  ): DurableNotificationPlatformRetryBackoffCalculationAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, calculationAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformRetryBackoffCalculationAnchor[] {
    return sortNotificationPlatformRetryBackoffCalculationAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
