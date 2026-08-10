/**
 * RC-24 Epic 6 — Reserved (inactive) channel adapters.
 */

import type { NotificationChannelPort } from '../ports/notification.port';
import type { ReservedNotificationChannelId } from '../domain/notification-channel';

export class ReservedInactiveChannelAdapter implements NotificationChannelPort {
  readonly active = false;

  constructor(readonly channelId: ReservedNotificationChannelId) {}

  send(): Readonly<{ ok: false; detail: string }> {
    return {
      ok: false,
      detail: `Channel ${this.channelId} is reserved-inactive`,
    };
  }
}
