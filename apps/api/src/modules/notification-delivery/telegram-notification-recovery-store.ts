import { Injectable } from '@nestjs/common';
import type { DurableTelegramNotificationAnchor } from './domain/durable-telegram-notification-anchor';
import { sortTelegramNotificationAnchorsDeterministically } from './domain/telegram-notification-restart-recovery';

function compositeKey(workspaceId: string, notificationId: string): string {
  return `${workspaceId}:${notificationId}`;
}

/**
 * In-memory runtime cache for recovered Telegram notification anchors (W5-N01-c).
 * Not a second Source of Truth — hydrated from W5-N01-b persistence on restart.
 */
@Injectable()
export class TelegramNotificationRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableTelegramNotificationAnchor>();

  replaceAll(anchors: readonly DurableTelegramNotificationAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.notificationId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableTelegramNotificationAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.notificationId), anchor);
    this.hydrated = true;
  }

  get(workspaceId: string, notificationId: string): DurableTelegramNotificationAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, notificationId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableTelegramNotificationAnchor[] {
    return sortTelegramNotificationAnchorsDeterministically([...this.byCompositeKey.values()]);
  }
}
