/**
 * REM-01-s1 — Telegram Bot API HTTP helper.
 *
 * Outbound traffic is constructed internally against api.telegram.org over
 * HTTPS. Operator-supplied URLs are not accepted. Does not import exchange
 * connectivity. Redirects are rejected. Response bodies are bounded.
 */

import { validateOutboundSsrfTarget } from '../../../security-platform/ssrf-allowlist';
import { isTelegramAbortError, type TelegramBotApiErrorCode } from './telegram-bot-api.errors';

export const TELEGRAM_BOT_API_HOST = 'api.telegram.org' as const;
export const TELEGRAM_BOT_API_ORIGIN = 'https://api.telegram.org' as const;
export const TELEGRAM_BOT_API_TIMEOUT_MS = 10_000;
export const MAX_TELEGRAM_BOT_API_BODY_CHARS = 4096;

export const TELEGRAM_BOT_API_METHODS = Object.freeze(['getMe', 'sendMessage'] as const);
export type TelegramBotApiMethod = (typeof TELEGRAM_BOT_API_METHODS)[number];

const BOT_TOKEN_PATTERN = /^[0-9A-Za-z:_-]{1,200}$/;

export type TelegramBotApiHttpResult =
  | Readonly<{ ok: true; status: number; bodyText: string }>
  | Readonly<{ ok: false; detail: TelegramBotApiErrorCode }>;

export type TelegramBotApiFetch = (
  input: string,
  init: {
    method: 'GET' | 'POST';
    headers?: Readonly<Record<string, string>>;
    body?: string;
    redirect: 'error';
    signal: AbortSignal;
  },
) => Promise<{ status: number; text(): Promise<string> }>;

export type TelegramBotApiHttpRequest = Readonly<{
  botToken: string;
  method: TelegramBotApiMethod;
  jsonBody?: Readonly<{ chat_id: string; text: string }>;
}>;

/**
 * Fail-closed egress check: existing SSRF helper + HTTPS-only + exact host.
 * Callers must pass the compile-time origin, never an operator URL.
 */
export function assertTelegramBotApiEgress(
  target: string,
): Readonly<{ ok: true; url: URL }> | Readonly<{ ok: false; detail: TelegramBotApiErrorCode }> {
  const ssrf = validateOutboundSsrfTarget(target, [TELEGRAM_BOT_API_HOST]);
  if (!ssrf.ok) {
    return Object.freeze({ ok: false, detail: 'telegram_invalid_request' as const });
  }
  if (ssrf.url.protocol !== 'https:') {
    return Object.freeze({ ok: false, detail: 'telegram_invalid_request' as const });
  }
  if (ssrf.url.hostname.toLowerCase() !== TELEGRAM_BOT_API_HOST) {
    return Object.freeze({ ok: false, detail: 'telegram_invalid_request' as const });
  }
  return Object.freeze({ ok: true, url: ssrf.url });
}

export class TelegramBotApiHttpClient {
  private readonly fetchFn: TelegramBotApiFetch;
  private readonly timeoutMs: number;

  constructor(
    fetchFn: TelegramBotApiFetch = fetch as TelegramBotApiFetch,
    timeoutMs: number = TELEGRAM_BOT_API_TIMEOUT_MS,
  ) {
    this.fetchFn = fetchFn;
    this.timeoutMs = timeoutMs;
  }

  async execute(input: TelegramBotApiHttpRequest): Promise<TelegramBotApiHttpResult> {
    const origin = assertTelegramBotApiEgress(TELEGRAM_BOT_API_ORIGIN);
    if (!origin.ok) {
      return origin;
    }

    const token = input.botToken.trim();
    if (!token || !BOT_TOKEN_PATTERN.test(token)) {
      return Object.freeze({ ok: false, detail: 'telegram_invalid_request' as const });
    }

    const httpMethod = input.method === 'sendMessage' ? 'POST' : 'GET';
    const url = `${TELEGRAM_BOT_API_ORIGIN}/bot${token}/${input.method}`;
    const constructed = assertConstructedTelegramUrl(url);
    if (!constructed.ok) {
      return constructed;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchFn(url, {
        method: httpMethod,
        redirect: 'error',
        signal: controller.signal,
        ...(httpMethod === 'POST'
          ? {
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(input.jsonBody ?? {}),
            }
          : {}),
      });
      const raw = await response.text();
      return Object.freeze({
        ok: true,
        status: response.status,
        bodyText: raw.slice(0, MAX_TELEGRAM_BOT_API_BODY_CHARS),
      });
    } catch (error) {
      if (isTelegramAbortError(error) || controller.signal.aborted) {
        return Object.freeze({ ok: false, detail: 'telegram_timeout' as const });
      }
      return Object.freeze({ ok: false, detail: 'telegram_network_error' as const });
    } finally {
      clearTimeout(timer);
    }
  }
}

function assertConstructedTelegramUrl(
  url: string,
): Readonly<{ ok: true }> | Readonly<{ ok: false; detail: TelegramBotApiErrorCode }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return Object.freeze({ ok: false, detail: 'telegram_invalid_request' as const });
  }
  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== TELEGRAM_BOT_API_HOST) {
    return Object.freeze({ ok: false, detail: 'telegram_invalid_request' as const });
  }
  return Object.freeze({ ok: true as const });
}
