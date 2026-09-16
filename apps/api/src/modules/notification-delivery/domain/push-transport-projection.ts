/**
 * Read-only classifier of the bound PUSH_CHANNEL_ADAPTER.
 *
 * Projection only. Does not send or retrieve Vault secrets.
 */

import { InMemoryPushAdapter } from '../adapters/in-memory-push.adapter';
import { ProductionWebPushNotificationAdapter } from '../adapters/production-web-push-notification.adapter';
import type { NotificationChannelPort } from '../ports/notification.port';

export type PushTransportKind = 'in-memory' | 'web-push';

export type PushTransportProjection = Readonly<{
  transport: PushTransportKind;
  pushUsed: boolean;
  adapterReached: boolean;
}>;

export const IN_MEMORY_PUSH_TRANSPORT: PushTransportProjection = Object.freeze({
  transport: 'in-memory',
  pushUsed: false,
  adapterReached: false,
});

export const WEB_PUSH_TRANSPORT: PushTransportProjection = Object.freeze({
  transport: 'web-push',
  pushUsed: true,
  adapterReached: true,
});

export function projectPushTransport(adapter: NotificationChannelPort): PushTransportProjection {
  if (adapter instanceof ProductionWebPushNotificationAdapter) {
    return WEB_PUSH_TRANSPORT;
  }
  if (adapter instanceof InMemoryPushAdapter) {
    return IN_MEMORY_PUSH_TRANSPORT;
  }
  return IN_MEMORY_PUSH_TRANSPORT;
}
