/**
 * Read-only classifier of the bound TEAMS_CHANNEL_ADAPTER.
 *
 * Projection only. Does not send or retrieve Vault secrets.
 */

import { InMemoryTeamsAdapter } from '../adapters/in-memory-teams.adapter';
import { ProductionTeamsWebhookNotificationAdapter } from '../adapters/production-teams-webhook-notification.adapter';
import type { NotificationChannelPort } from '../ports/notification.port';

export type TeamsTransportKind = 'in-memory' | 'webhook';

export type TeamsTransportProjection = Readonly<{
  transport: TeamsTransportKind;
  webhookUsed: boolean;
}>;

export const IN_MEMORY_TEAMS_TRANSPORT: TeamsTransportProjection = Object.freeze({
  transport: 'in-memory',
  webhookUsed: false,
});

export const WEBHOOK_TEAMS_TRANSPORT: TeamsTransportProjection = Object.freeze({
  transport: 'webhook',
  webhookUsed: true,
});

export function projectTeamsTransport(adapter: NotificationChannelPort): TeamsTransportProjection {
  if (adapter instanceof ProductionTeamsWebhookNotificationAdapter) {
    return WEBHOOK_TEAMS_TRANSPORT;
  }
  if (adapter instanceof InMemoryTeamsAdapter) {
    return IN_MEMORY_TEAMS_TRANSPORT;
  }
  return IN_MEMORY_TEAMS_TRANSPORT;
}
