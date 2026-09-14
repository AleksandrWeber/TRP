/**
 * REM-02 — Parse Telegram /start bind updates.
 *
 * Extracts connection token + numeric chat.id from a Telegram Update.
 * Does not call Bot API. Does not persist. Does not execute trading commands.
 */

import {
  parseProductionTelegramChatId,
  TELEGRAM_CHAT_ID_NOT_BOUND,
} from './production-telegram-chat-id';

export const TELEGRAM_BIND_NOT_OBSERVED = 'telegram_bind_not_observed' as const;
export const TELEGRAM_BIND_INVALID_UPDATE = 'telegram_bind_invalid_update' as const;
export const TELEGRAM_BIND_CONTROL_PLANE_REJECTED = 'telegram_bind_control_plane_rejected' as const;
export const TELEGRAM_BIND_TOKEN_MISMATCH = 'telegram_bind_token_mismatch' as const;
export const TELEGRAM_BIND_AMBIGUOUS = 'telegram_bind_ambiguous' as const;

const START_COMMAND = /^\/start(?:@\S+)?(?:\s+(.+))?$/u;
const DEEP_LINK_PREFIX = 'tg://connect/';

const CONTROL_PLANE_PAYLOADS = new Set(
  [
    'stop-trading',
    'approve-trade',
    'execute-trade',
    'start-trading',
    'stop',
    'approve',
    'execute',
    'kill',
    'pause',
  ].map((value) => value.toLowerCase()),
);

export type TelegramStartBindDetail =
  | typeof TELEGRAM_BIND_NOT_OBSERVED
  | typeof TELEGRAM_BIND_INVALID_UPDATE
  | typeof TELEGRAM_BIND_CONTROL_PLANE_REJECTED
  | typeof TELEGRAM_BIND_TOKEN_MISMATCH
  | typeof TELEGRAM_BIND_AMBIGUOUS
  | typeof TELEGRAM_CHAT_ID_NOT_BOUND;

export type TelegramStartBindResult =
  | Readonly<{ ok: true; chatId: string; connectionToken: string }>
  | Readonly<{ ok: false; detail: TelegramStartBindDetail }>;

export function normalizeTelegramStartPayload(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.toLowerCase().startsWith(DEEP_LINK_PREFIX)) {
    return trimmed.slice(DEEP_LINK_PREFIX.length).trim();
  }
  return trimmed;
}

export function isTelegramControlPlaneStartPayload(payload: string): boolean {
  return CONTROL_PLANE_PAYLOADS.has(payload.trim().toLowerCase());
}

/**
 * Parse `/start` / `/start@bot payload`. Empty payload is not a bind.
 */
export function parseTelegramStartCommand(
  text: string,
): Readonly<{ ok: true; payload: string }> | Readonly<{ ok: false }> {
  const trimmed = text.trim();
  const match = START_COMMAND.exec(trimmed);
  if (!match) {
    return Object.freeze({ ok: false as const });
  }
  const payload = normalizeTelegramStartPayload(match[1] ?? '');
  if (!payload) {
    return Object.freeze({ ok: false as const });
  }
  return Object.freeze({ ok: true as const, payload });
}

export function extractTelegramBindFromUpdate(
  update: unknown,
  expectedToken: string,
): TelegramStartBindResult {
  const expected = expectedToken.trim();
  if (!expected) {
    return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_INVALID_UPDATE });
  }
  if (isTelegramControlPlaneStartPayload(expected)) {
    return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_CONTROL_PLANE_REJECTED });
  }
  if (update === null || typeof update !== 'object' || Array.isArray(update)) {
    return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_INVALID_UPDATE });
  }

  const message = (update as { message?: unknown }).message;
  if (message === null || typeof message !== 'object' || Array.isArray(message)) {
    return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_INVALID_UPDATE });
  }

  const text = (message as { text?: unknown }).text;
  if (typeof text !== 'string') {
    return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_INVALID_UPDATE });
  }

  const command = parseTelegramStartCommand(text);
  if (!command.ok) {
    return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_NOT_OBSERVED });
  }
  if (isTelegramControlPlaneStartPayload(command.payload)) {
    return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_CONTROL_PLANE_REJECTED });
  }
  if (command.payload !== expected) {
    return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_TOKEN_MISMATCH });
  }

  const chat = (message as { chat?: unknown }).chat;
  if (chat === null || typeof chat !== 'object' || Array.isArray(chat)) {
    return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_INVALID_UPDATE });
  }
  const rawChatId = (chat as { id?: unknown }).id;
  const chatIdText =
    typeof rawChatId === 'number' || typeof rawChatId === 'string' ? String(rawChatId) : '';
  const parsed = parseProductionTelegramChatId(chatIdText);
  if (!parsed.ok) {
    return Object.freeze({ ok: false as const, detail: parsed.detail });
  }
  return Object.freeze({
    ok: true as const,
    chatId: parsed.chatId,
    connectionToken: expected,
  });
}

export function findTelegramStartBind(
  updates: readonly unknown[],
  expectedToken: string,
): TelegramStartBindResult {
  const expected = expectedToken.trim();
  if (!expected) {
    return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_INVALID_UPDATE });
  }
  if (isTelegramControlPlaneStartPayload(expected)) {
    return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_CONTROL_PLANE_REJECTED });
  }

  const matchedChatIds = new Set<string>();
  let bound: Extract<TelegramStartBindResult, { ok: true }> | undefined;
  let sawControlPlane = false;

  for (const update of updates) {
    const extracted = extractTelegramBindFromUpdate(update, expected);
    if (extracted.ok) {
      matchedChatIds.add(extracted.chatId);
      bound = extracted;
      continue;
    }
    if (extracted.detail === TELEGRAM_BIND_CONTROL_PLANE_REJECTED) {
      sawControlPlane = true;
    }
  }

  if (matchedChatIds.size > 1) {
    return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_AMBIGUOUS });
  }
  if (bound) {
    return bound;
  }
  if (sawControlPlane) {
    return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_CONTROL_PLANE_REJECTED });
  }
  return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_NOT_OBSERVED });
}
