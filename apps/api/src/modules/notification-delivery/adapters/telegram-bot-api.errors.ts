/**
 * REM-01-s1 — Telegram Bot API error classification.
 *
 * Stable internal codes only. Never echo bot tokens, tokenized URLs, or vendor
 * bodies. Classification does not execute retries.
 */

import { TELEGRAM_CHAT_ID_NOT_BOUND } from '../domain/production-telegram-chat-id';

export const TELEGRAM_BOT_API_ERROR_CODES = Object.freeze([
  'telegram_unauthorized',
  'telegram_forbidden',
  'telegram_not_found',
  'telegram_rate_limited',
  'telegram_server_error',
  'telegram_timeout',
  'telegram_network_error',
  'telegram_invalid_response',
  TELEGRAM_CHAT_ID_NOT_BOUND,
  'telegram_invalid_request',
  'telegram_unexpected_status',
] as const);

export type TelegramBotApiErrorCode = (typeof TELEGRAM_BOT_API_ERROR_CODES)[number];

export type TelegramBotApiErrorKind = 'Error' | 'Unavailable';

export type TelegramBotApiErrorClassification = Readonly<{
  kind: TelegramBotApiErrorKind;
  retryable: boolean;
}>;

const RETRYABLE_UNAVAILABLE = Object.freeze({
  kind: 'Unavailable',
  retryable: true,
} satisfies TelegramBotApiErrorClassification);

const TERMINAL_ERROR = Object.freeze({
  kind: 'Error',
  retryable: false,
} satisfies TelegramBotApiErrorClassification);

export function classifyTelegramBotApiError(
  code: TelegramBotApiErrorCode,
): TelegramBotApiErrorClassification {
  switch (code) {
    case 'telegram_rate_limited':
    case 'telegram_server_error':
    case 'telegram_timeout':
    case 'telegram_network_error':
      return RETRYABLE_UNAVAILABLE;
    default:
      return TERMINAL_ERROR;
  }
}

export function mapTelegramHttpStatus(status: number): TelegramBotApiErrorCode {
  if (status === 400) return 'telegram_invalid_request';
  if (status === 401) return 'telegram_unauthorized';
  if (status === 403) return 'telegram_forbidden';
  if (status === 404) return 'telegram_not_found';
  if (status === 429) return 'telegram_rate_limited';
  if (status >= 500 && status <= 599) return 'telegram_server_error';
  return 'telegram_unexpected_status';
}

export function isTelegramAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as { name?: unknown };
  return candidate.name === 'AbortError' || candidate.name === 'TimeoutError';
}

const TOKENIZED_BOT_URL = /https:\/\/api\.telegram\.org\/bot[^/\s"'`]+/gi;

/**
 * Strip token material from strings that may have been produced by fetch.
 * Returned adapter `detail` must still be a stable code, not this text.
 */
export function redactTelegramSecrets(value: string, botToken?: string): string {
  let redacted = value.replace(TOKENIZED_BOT_URL, 'https://api.telegram.org/bot<redacted>');
  if (botToken && botToken.length > 0) {
    redacted = redacted.split(botToken).join('<redacted>');
  }
  return redacted;
}

export function containsTelegramSecret(value: string, botToken: string): boolean {
  if (!botToken) return false;
  return value.includes(botToken);
}
