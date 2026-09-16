/**
 * Read-only classifier of the bound DISCORD_CHANNEL_ADAPTER.
 *
 * Projection only. Does not send or retrieve Vault secrets.
 */

import { InMemoryDiscordAdapter } from '../adapters/in-memory-discord.adapter';
import { ProductionDiscordWebhookNotificationAdapter } from '../adapters/production-discord-webhook-notification.adapter';
import type { NotificationChannelPort } from '../ports/notification.port';

export type DiscordTransportKind = 'in-memory' | 'webhook';

export type DiscordTransportProjection = Readonly<{
  transport: DiscordTransportKind;
  webhookUsed: boolean;
}>;

export const IN_MEMORY_DISCORD_TRANSPORT: DiscordTransportProjection = Object.freeze({
  transport: 'in-memory',
  webhookUsed: false,
});

export const WEBHOOK_DISCORD_TRANSPORT: DiscordTransportProjection = Object.freeze({
  transport: 'webhook',
  webhookUsed: true,
});

export function projectDiscordTransport(
  adapter: NotificationChannelPort,
): DiscordTransportProjection {
  if (adapter instanceof ProductionDiscordWebhookNotificationAdapter) {
    return WEBHOOK_DISCORD_TRANSPORT;
  }
  if (adapter instanceof InMemoryDiscordAdapter) {
    return IN_MEMORY_DISCORD_TRANSPORT;
  }
  return IN_MEMORY_DISCORD_TRANSPORT;
}
