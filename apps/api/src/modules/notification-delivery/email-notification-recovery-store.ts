import { Injectable } from '@nestjs/common';
import type { DurableEmailNotificationAnchor } from './domain/durable-email-notification-anchor';
import { sortEmailNotificationAnchorsDeterministically } from './domain/email-notification-restart-recovery';

function compositeKey(workspaceId: string, notificationId: string): string {
  return `${workspaceId}:${notificationId}`;
}

/**
 * In-memory runtime cache for recovered Email notification anchors (W5-N02-c).
 * Not a second Source of Truth — hydrated from W5-N02-b persistence on restart.
 */
@Injectable()
export class EmailNotificationRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableEmailNotificationAnchor>();

  replaceAll(anchors: readonly DurableEmailNotificationAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.notificationId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableEmailNotificationAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.notificationId), anchor);
    this.hydrated = true;
  }

  get(workspaceId: string, notificationId: string): DurableEmailNotificationAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, notificationId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableEmailNotificationAnchor[] {
    return sortEmailNotificationAnchorsDeterministically([...this.byCompositeKey.values()]);
  }
}
