/**
 * REM-03 — read-only classifier of the bound TELEGRAM_CHANNEL_ADAPTER.
 *
 * Projection only. Does not send, getMe, getUpdates, or retrieve Vault secrets.
 * Not a generic transport framework.
 */

import { InMemoryTelegramAdapter } from '../adapters/in-memory-telegram.adapter';
import { ProductionTelegramBotApiAdapter } from '../adapters/telegram-bot-api.adapter';
import type { NotificationChannelPort } from '../ports/notification.port';

export type TelegramTransportKind = 'in-memory' | 'bot-api';

export type TelegramTransportProjection = Readonly<{
  transport: TelegramTransportKind;
  botApiUsed: boolean;
}>;

export const IN_MEMORY_TELEGRAM_TRANSPORT: TelegramTransportProjection = Object.freeze({
  transport: 'in-memory',
  botApiUsed: false,
});

export const BOT_API_TELEGRAM_TRANSPORT: TelegramTransportProjection = Object.freeze({
  transport: 'bot-api',
  botApiUsed: true,
});

/**
 * Classify the already-injected Telegram channel adapter.
 * Production adapter → bot-api / true. In-memory harness → in-memory / false.
 */
export function projectTelegramTransport(
  adapter: NotificationChannelPort,
): TelegramTransportProjection {
  if (adapter instanceof ProductionTelegramBotApiAdapter) {
    return BOT_API_TELEGRAM_TRANSPORT;
  }
  if (adapter instanceof InMemoryTelegramAdapter) {
    return IN_MEMORY_TELEGRAM_TRANSPORT;
  }
  return IN_MEMORY_TELEGRAM_TRANSPORT;
}
