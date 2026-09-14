import { describe, expect, it } from 'vitest';
import {
  classifyTelegramBotApiError,
  containsTelegramSecret,
  isTelegramAbortError,
  mapTelegramHttpStatus,
  redactTelegramSecrets,
} from './telegram-bot-api.errors';

describe('telegram-bot-api.errors (REM-01-s1)', () => {
  it('maps vendor HTTP statuses to stable codes', () => {
    expect(mapTelegramHttpStatus(401)).toBe('telegram_unauthorized');
    expect(mapTelegramHttpStatus(403)).toBe('telegram_forbidden');
    expect(mapTelegramHttpStatus(404)).toBe('telegram_not_found');
    expect(mapTelegramHttpStatus(429)).toBe('telegram_rate_limited');
    expect(mapTelegramHttpStatus(500)).toBe('telegram_server_error');
    expect(mapTelegramHttpStatus(503)).toBe('telegram_server_error');
    expect(mapTelegramHttpStatus(418)).toBe('telegram_unexpected_status');
    expect(mapTelegramHttpStatus(400)).toBe('telegram_invalid_request');
  });

  it('classifies retryable unavailable vs terminal errors without executing retries', () => {
    expect(classifyTelegramBotApiError('telegram_rate_limited')).toEqual({
      kind: 'Unavailable',
      retryable: true,
    });
    expect(classifyTelegramBotApiError('telegram_timeout')).toEqual({
      kind: 'Unavailable',
      retryable: true,
    });
    expect(classifyTelegramBotApiError('telegram_unauthorized')).toEqual({
      kind: 'Error',
      retryable: false,
    });
    expect(classifyTelegramBotApiError('telegram_chat_id_not_bound')).toEqual({
      kind: 'Error',
      retryable: false,
    });
  });

  it('redacts tokenized Bot API URLs and token material', () => {
    const token = '123456:TEST-token_secret';
    const raw = `fetch failed https://api.telegram.org/bot${token}/getMe`;
    const redacted = redactTelegramSecrets(raw, token);
    expect(redacted).not.toContain(token);
    expect(containsTelegramSecret(redacted, token)).toBe(false);
    expect(redacted).toContain('api.telegram.org/bot<redacted>');
  });

  it('detects abort/timeout errors', () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    expect(isTelegramAbortError(abort)).toBe(true);
    const timeout = new Error('timeout');
    timeout.name = 'TimeoutError';
    expect(isTelegramAbortError(timeout)).toBe(true);
    expect(isTelegramAbortError(new Error('dns'))).toBe(false);
  });
});
