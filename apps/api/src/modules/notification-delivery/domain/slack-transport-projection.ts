/**
 * Read-only classifier of the bound SLACK_CHANNEL_ADAPTER.
 *
 * Projection only. Does not send or retrieve Vault secrets.
 */

import { InMemorySlackAdapter } from '../adapters/in-memory-slack.adapter';
import { ProductionSlackWebhookNotificationAdapter } from '../adapters/production-slack-webhook-notification.adapter';
import type { NotificationChannelPort } from '../ports/notification.port';

export type SlackTransportKind = 'in-memory' | 'webhook';

export type SlackTransportProjection = Readonly<{
  transport: SlackTransportKind;
  webhookUsed: boolean;
}>;

export const IN_MEMORY_SLACK_TRANSPORT: SlackTransportProjection = Object.freeze({
  transport: 'in-memory',
  webhookUsed: false,
});

export const WEBHOOK_SLACK_TRANSPORT: SlackTransportProjection = Object.freeze({
  transport: 'webhook',
  webhookUsed: true,
});

export function projectSlackTransport(adapter: NotificationChannelPort): SlackTransportProjection {
  if (adapter instanceof ProductionSlackWebhookNotificationAdapter) {
    return WEBHOOK_SLACK_TRANSPORT;
  }
  if (adapter instanceof InMemorySlackAdapter) {
    return IN_MEMORY_SLACK_TRANSPORT;
  }
  return IN_MEMORY_SLACK_TRANSPORT;
}
