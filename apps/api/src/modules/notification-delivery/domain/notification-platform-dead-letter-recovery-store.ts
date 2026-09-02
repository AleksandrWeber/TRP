import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformDeadLetterAnchor } from './durable-notification-platform-dead-letter-anchor';
import { sortNotificationPlatformDeadLetterAnchorsDeterministically } from './notification-platform-dead-letter-restart-recovery';

function compositeKey(workspaceId: string, deadLetterAnchorId: string): string {
  return `${workspaceId}:${deadLetterAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Dead Letter anchors (W5-N14-c).
 * Not a second Source of Truth — hydrated from W5-N14-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformDeadLetterRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableNotificationPlatformDeadLetterAnchor>();

  replaceAll(anchors: readonly DurableNotificationPlatformDeadLetterAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.deadLetterAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformDeadLetterAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.deadLetterAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    deadLetterAnchorId: string,
  ): DurableNotificationPlatformDeadLetterAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, deadLetterAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformDeadLetterAnchor[] {
    return sortNotificationPlatformDeadLetterAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
