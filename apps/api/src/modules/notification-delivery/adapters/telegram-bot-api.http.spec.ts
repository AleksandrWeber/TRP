import { describe, expect, it } from 'vitest';
import {
  assertTelegramBotApiEgress,
  MAX_TELEGRAM_BOT_API_BODY_CHARS,
  TELEGRAM_BOT_API_HOST,
  TELEGRAM_BOT_API_ORIGIN,
  TelegramBotApiHttpClient,
  type TelegramBotApiFetch,
} from './telegram-bot-api.http';

const TOKEN = '123456:HTTP-TEST-TOKEN';

function abortError(): Error {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
}

function abortingFetch(): TelegramBotApiFetch {
  return async (_input, init) => {
    if (init.signal.aborted) {
      throw abortError();
    }
    await new Promise<void>((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(abortError()));
    });
    throw abortError();
  };
}

describe('telegram-bot-api.http (REM-01-s1)', () => {
  it('enforces HTTPS and the exact api.telegram.org host', () => {
    expect(assertTelegramBotApiEgress(TELEGRAM_BOT_API_ORIGIN).ok).toBe(true);
    expect(assertTelegramBotApiEgress('http://api.telegram.org').ok).toBe(false);
    expect(assertTelegramBotApiEgress('https://evil.example/steal').ok).toBe(false);
    expect(assertTelegramBotApiEgress('https://api.telegram.org.evil.example').ok).toBe(false);
    const allowed = assertTelegramBotApiEgress(TELEGRAM_BOT_API_ORIGIN);
    if (!allowed.ok) throw new Error('expected origin to pass');
    expect(allowed.url.protocol).toBe('https:');
    expect(allowed.url.hostname).toBe(TELEGRAM_BOT_API_HOST);
  });

  it('calls only the compile-time Telegram origin with redirects disabled', async () => {
    const calls: Array<{ url: string; redirect: string; method: string }> = [];
    const client = new TelegramBotApiHttpClient(async (url, init) => {
      calls.push({ url, redirect: init.redirect, method: init.method });
      return { status: 200, text: async () => '{"ok":true}' };
    });

    const result = await client.execute({ botToken: TOKEN, method: 'getMe' });
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(1);
    const parsed = new URL(calls[0]!.url);
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe('api.telegram.org');
    expect(parsed.pathname.endsWith('/getMe')).toBe(true);
    expect(calls[0]!.redirect).toBe('error');
    expect(calls[0]!.method).toBe('GET');
  });

  it('calls getUpdates against the compile-time origin with timeout=0 (MOCKED)', async () => {
    const calls: Array<{ url: string; method: string; redirect: string }> = [];
    const client = new TelegramBotApiHttpClient(async (url, init) => {
      calls.push({ url, method: init.method, redirect: init.redirect });
      return { status: 200, text: async () => '{"ok":true,"result":[]}' };
    });
    const result = await client.execute({ botToken: TOKEN, method: 'getUpdates' });
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(1);
    const parsed = new URL(calls[0]!.url);
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe('api.telegram.org');
    expect(parsed.pathname.endsWith('/getUpdates')).toBe(true);
    expect(parsed.searchParams.get('timeout')).toBe('0');
    expect(calls[0]!.method).toBe('GET');
    expect(calls[0]!.redirect).toBe('error');
  });

  it('does not let operator-controlled URLs choose the target', async () => {
    const calls: string[] = [];
    const client = new TelegramBotApiHttpClient(async (url) => {
      calls.push(url);
      return { status: 200, text: async () => '{"ok":true,"result":{"message_id":1}}' };
    });

    await client.execute({
      botToken: TOKEN,
      method: 'sendMessage',
      jsonBody: {
        chat_id: '1',
        text: 'see https://evil.example/steal and http://127.0.0.1/admin',
      },
    });

    expect(calls).toHaveLength(1);
    const parsed = new URL(calls[0]!);
    expect(parsed.hostname).toBe('api.telegram.org');
    expect(parsed.protocol).toBe('https:');
    expect(calls[0]).not.toContain('evil.example');
  });

  it('maps timeout and network failures without leaking the token', async () => {
    const timeoutClient = new TelegramBotApiHttpClient(abortingFetch(), 5);
    const timeout = await timeoutClient.execute({ botToken: TOKEN, method: 'getMe' });
    expect(timeout).toEqual({ ok: false, detail: 'telegram_timeout' });
    expect(JSON.stringify(timeout)).not.toContain(TOKEN);

    const networkClient = new TelegramBotApiHttpClient(async () => {
      throw new Error(`getaddrinfo ENOTFOUND https://api.telegram.org/bot${TOKEN}/getMe`);
    });
    const network = await networkClient.execute({ botToken: TOKEN, method: 'getMe' });
    expect(network).toEqual({ ok: false, detail: 'telegram_network_error' });
    expect(JSON.stringify(network)).not.toContain(TOKEN);
  });

  it('bounds response bodies', async () => {
    const huge = 'x'.repeat(MAX_TELEGRAM_BOT_API_BODY_CHARS + 2048);
    const client = new TelegramBotApiHttpClient(async () => ({
      status: 200,
      text: async () => huge,
    }));
    const result = await client.execute({ botToken: TOKEN, method: 'getMe' });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected http ok');
    expect(result.bodyText).toHaveLength(MAX_TELEGRAM_BOT_API_BODY_CHARS);
  });

  it('rejects malformed tokens that could alter the URL host', async () => {
    const calls: string[] = [];
    const client = new TelegramBotApiHttpClient(async (url) => {
      calls.push(url);
      return { status: 200, text: async () => '{"ok":true}' };
    });
    const result = await client.execute({
      botToken: 'https://evil.example#',
      method: 'getMe',
    });
    expect(result).toEqual({ ok: false, detail: 'telegram_invalid_request' });
    expect(calls).toEqual([]);
  });
});
