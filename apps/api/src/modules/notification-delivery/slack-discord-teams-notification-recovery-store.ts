import { Injectable } from '@nestjs/common';
import type { DurableSlackDiscordTeamsNotificationAnchor } from './domain/durable-slack-discord-teams-notification-anchor';
import { sortSlackDiscordTeamsNotificationAnchorsDeterministically } from './domain/slack-discord-teams-notification-restart-recovery';

function compositeKey(workspaceId: string, notificationId: string): string {
  return `${workspaceId}:${notificationId}`;
}

/**
 * In-memory runtime cache for recovered Slack / Discord / Teams notification anchors (W5-N03-c).
 * Not a second Source of Truth — hydrated from W5-N03-b persistence on restart.
 */
@Injectable()
export class SlackDiscordTeamsNotificationRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableSlackDiscordTeamsNotificationAnchor>();

  replaceAll(anchors: readonly DurableSlackDiscordTeamsNotificationAnchor[]): void {
    this.byCompositeKey.clear();
    for (const anchor of anchors) {
      this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.notificationId), anchor);
    }
    this.hydrated = true;
  }

  set(anchor: DurableSlackDiscordTeamsNotificationAnchor): void {
    this.byCompositeKey.set(compositeKey(anchor.workspaceId, anchor.notificationId), anchor);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    notificationId: string,
  ): DurableSlackDiscordTeamsNotificationAnchor | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, notificationId)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableSlackDiscordTeamsNotificationAnchor[] {
    return sortSlackDiscordTeamsNotificationAnchorsDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
