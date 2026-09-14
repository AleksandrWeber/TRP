/**
 * REM-01-s1 — Production Telegram chat-id guard.
 *
 * Rejects synthetic / in-memory destinations so they cannot be treated as
 * Telegram Bot API chat identities. Does not discover, bind, or look up chats.
 */

export const TELEGRAM_CHAT_ID_NOT_BOUND = 'telegram_chat_id_not_bound' as const;

const PRODUCTION_CHAT_ID = /^-?\d+$/;

export type ProductionTelegramChatIdResult =
  | Readonly<{ ok: true; chatId: string }>
  | Readonly<{ ok: false; detail: typeof TELEGRAM_CHAT_ID_NOT_BOUND }>;

/**
 * Strict production destination check. Accepts Telegram numeric chat ids
 * (including negative supergroup/channel ids). Rejects empty, whitespace,
 * `in-memory:*`, and any non-numeric identifier.
 */
export function parseProductionTelegramChatId(value: string): ProductionTelegramChatIdResult {
  const chatId = value.trim();
  if (!chatId) {
    return Object.freeze({ ok: false, detail: TELEGRAM_CHAT_ID_NOT_BOUND });
  }
  if (chatId.toLowerCase().startsWith('in-memory:')) {
    return Object.freeze({ ok: false, detail: TELEGRAM_CHAT_ID_NOT_BOUND });
  }
  if (!PRODUCTION_CHAT_ID.test(chatId)) {
    return Object.freeze({ ok: false, detail: TELEGRAM_CHAT_ID_NOT_BOUND });
  }
  return Object.freeze({ ok: true, chatId });
}
