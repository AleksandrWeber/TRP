import { Injectable } from '@nestjs/common';
import type { DurableNotificationPlatformIntegrationAnchor } from './domain/durable-notification-platform-integration-anchor';
import { sortNotificationPlatformIntegrationAnchorsDeterministically } from './domain/notification-platform-integration-restart-recovery';

function compositeKey(workspaceId: string, integrationAnchorId: string): string {
  return `${workspaceId}:${integrationAnchorId}`;
}

/**
 * In-memory runtime cache for recovered Notification Platform Integration anchors (W5-N05-c).
 * Not a second Source of Truth — hydrated from W5-N05-b persistence on restart.
 */
@Injectable()
export class NotificationPlatformIntegrationRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableNotificationPlatformIntegrationAnchor>();

  replaceAll(anchors: readonly DurableNotificationPlatformIntegrationAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.integrationAnchorId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableNotificationPlatformIntegrationAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.integrationAnchorId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    integrationAnchorId: string,
  ): DurableNotificationPlatformIntegrationAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, integrationAnchorId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableNotificationPlatformIntegrationAnchor[] {
    return sortNotificationPlatformIntegrationAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
