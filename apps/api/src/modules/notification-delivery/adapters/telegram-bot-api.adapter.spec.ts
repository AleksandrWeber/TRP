import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { LogContext, Logger } from '../../../logging/logger';
import { ProductionTelegramBotApiAdapter } from './telegram-bot-api.adapter';
import { TelegramBotApiHttpClient, type TelegramBotApiFetch } from './telegram-bot-api.http';

const TOKEN = '123456:ADAPTER-TEST-TOKEN';
const ADAPTER_SOURCE = readFileSync(join(__dirname, 'telegram-bot-api.adapter.ts'), 'utf8');

class RecordingLogger implements Logger {
  readonly lines: string[] = [];

  child(): Logger {
    return this;
  }

  debug(message: string, context?: LogContext): void {
    this.capture('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.capture('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.capture('warn', message, context);
  }

  error(message: string, context?: LogContext, error?: unknown): void {
    this.capture('error', message, context, error);
  }

  private capture(level: string, message: string, context?: LogContext, error?: unknown): void {
    this.lines.push(JSON.stringify({ level, message, context, error }));
  }
}

function jsonFetch(
  status: number,
  body: unknown,
  sink?: Array<{ url: string; init: Parameters<TelegramBotApiFetch>[1] }>,
): TelegramBotApiFetch {
  return async (url, init) => {
    sink?.push({ url, init });
    return {
      status,
      text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    };
  };
}

function adapterFor(
  fetchFn: TelegramBotApiFetch,
  logger?: Logger,
  timeoutMs?: number,
): ProductionTelegramBotApiAdapter {
  return new ProductionTelegramBotApiAdapter(
    new TelegramBotApiHttpClient(fetchFn, timeoutMs),
    logger,
  );
}

describe('ProductionTelegramBotApiAdapter (REM-01-s1)', () => {
  it('succeeds getMe when HTTP 200 and ok === true', async () => {
    const result = await adapterFor(
      jsonFetch(200, { ok: true, result: { id: 1, is_bot: true } }),
    ).getMe({ botToken: TOKEN, workspaceId: 'workspace-a' });
    expect(result).toEqual({ ok: true });
    expect(JSON.stringify(result)).not.toContain(TOKEN);
  });

  it('fails getMe on malformed JSON', async () => {
    const result = await adapterFor(jsonFetch(200, '{not-json')).getMe({ botToken: TOKEN });
    expect(result).toEqual({ ok: false, detail: 'telegram_invalid_response' });
  });

  it('fails getMe on non-200', async () => {
    const result = await adapterFor(jsonFetch(401, { ok: false })).getMe({ botToken: TOKEN });
    expect(result).toEqual({ ok: false, detail: 'telegram_unauthorized' });
  });

  it('succeeds sendMessage when HTTP 200, ok === true, and result.message_id exists', async () => {
    const calls: Array<{ url: string; init: Parameters<TelegramBotApiFetch>[1] }> = [];
    const result = await adapterFor(
      jsonFetch(200, { ok: true, result: { message_id: 42 } }, calls),
    ).sendMessage({
      botToken: TOKEN,
      chatId: '123456789',
      subject: 'Daily report',
      body: 'Delivery channel only',
      workspaceId: 'workspace-a',
    });
    expect(result).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.init.method).toBe('POST');
    expect(calls[0]!.init.redirect).toBe('error');
    expect(JSON.parse(calls[0]!.init.body ?? '{}')).toEqual({
      chat_id: '123456789',
      text: 'Daily report\n\nDelivery channel only',
    });
    const parsed = new URL(calls[0]!.url);
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe('api.telegram.org');
  });

  it('requires ok === true for sendMessage even on HTTP 200', async () => {
    const result = await adapterFor(
      jsonFetch(200, { ok: false, result: { message_id: 1 } }),
    ).sendMessage({
      botToken: TOKEN,
      chatId: '1',
      subject: 's',
      body: 'b',
    });
    expect(result).toEqual({ ok: false, detail: 'telegram_invalid_response' });
  });

  it('requires result.message_id for sendMessage', async () => {
    const result = await adapterFor(jsonFetch(200, { ok: true, result: {} })).sendMessage({
      botToken: TOKEN,
      chatId: '1',
      subject: 's',
      body: 'b',
    });
    expect(result).toEqual({ ok: false, detail: 'telegram_invalid_response' });
  });

  it('maps 401, 403, 404, 429, 5xx, and unexpected statuses', async () => {
    const cases = [
      [401, 'telegram_unauthorized'],
      [403, 'telegram_forbidden'],
      [404, 'telegram_not_found'],
      [429, 'telegram_rate_limited'],
      [500, 'telegram_server_error'],
      [418, 'telegram_unexpected_status'],
    ] as const;
    for (const [status, detail] of cases) {
      const result = await adapterFor(jsonFetch(status, { ok: false })).sendMessage({
        botToken: TOKEN,
        chatId: '1',
        subject: 's',
        body: 'b',
      });
      expect(result).toEqual({ ok: false, detail });
    }
  });

  it('maps timeout and network failures', async () => {
    const timeout = await adapterFor(
      async (_url, init) => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        await new Promise<void>((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(error));
        });
        throw error;
      },
      undefined,
      5,
    ).getMe({ botToken: TOKEN });
    expect(timeout).toEqual({ ok: false, detail: 'telegram_timeout' });

    const network = await adapterFor(async () => {
      throw new Error(`fetch failed for https://api.telegram.org/bot${TOKEN}/getMe`);
    }).getMe({ botToken: TOKEN });
    expect(network).toEqual({ ok: false, detail: 'telegram_network_error' });
    expect(JSON.stringify(network)).not.toContain(TOKEN);
  });

  it('rejects synthetic, in-memory, chat-auto-42, empty, and non-numeric chat ids', async () => {
    const calls: unknown[] = [];
    const subject = adapterFor(async (url) => {
      calls.push(url);
      return { status: 200, text: async () => '{"ok":true,"result":{"message_id":1}}' };
    });
    const rejected = [
      'in-memory:workspace-a:user-a',
      'in-memory:ws:user',
      'chat-auto-42',
      '',
      '   ',
      'not-a-chat',
    ];
    for (const chatId of rejected) {
      const result = await subject.send({
        botToken: TOKEN,
        chatId,
        subject: 's',
        body: 'b',
      });
      expect(result).toEqual({ ok: false, detail: 'telegram_chat_id_not_bound' });
    }
    expect(calls).toEqual([]);
  });

  it('accepts positive and negative numeric chat ids at the adapter boundary', async () => {
    const chatIds: string[] = [];
    const subject = adapterFor(async (_url, init) => {
      chatIds.push(JSON.parse(init.body ?? '{}').chat_id);
      return { status: 200, text: async () => '{"ok":true,"result":{"message_id":9}}' };
    });
    await expect(
      subject.sendMessage({ botToken: TOKEN, chatId: '42', subject: 's', body: 'b' }),
    ).resolves.toEqual({ ok: true });
    await expect(
      subject.sendMessage({
        botToken: TOKEN,
        chatId: '-1001234567890',
        subject: 's',
        body: 'b',
      }),
    ).resolves.toEqual({ ok: true });
    expect(chatIds).toEqual(['42', '-1001234567890']);
  });

  it('does not let message content steer the outbound host', async () => {
    const urls: string[] = [];
    await adapterFor(async (url) => {
      urls.push(url);
      return { status: 200, text: async () => '{"ok":true,"result":{"message_id":1}}' };
    }).sendMessage({
      botToken: TOKEN,
      chatId: '1',
      subject: 'https://evil.example',
      body: 'http://127.0.0.1/admin',
    });
    expect(urls).toHaveLength(1);
    expect(new URL(urls[0]!).hostname).toBe('api.telegram.org');
    expect(new URL(urls[0]!).protocol).toBe('https:');
  });

  it('never writes the token into logs or returned errors', async () => {
    const logger = new RecordingLogger();
    const result = await adapterFor(async () => {
      throw new Error(`https://api.telegram.org/bot${TOKEN}/getMe ENOTFOUND`);
    }, logger).getMe({ botToken: TOKEN, workspaceId: 'workspace-a' });
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain(TOKEN);
    expect(logger.lines.join('\n')).not.toContain(TOKEN);
    expect(logger.lines.join('\n')).not.toMatch(/bot123456/);
  });

  it('does not dump vendor bodies into error detail', async () => {
    const body = `{"ok":false,"description":"secret ${TOKEN} leak","result":{"padding":"${'x'.repeat(3000)}"}}`;
    const result = await adapterFor(jsonFetch(401, body)).getMe({ botToken: TOKEN });
    expect(result).toEqual({ ok: false, detail: 'telegram_unauthorized' });
    expect(JSON.stringify(result)).not.toContain(TOKEN);
    expect(JSON.stringify(result)).not.toContain('padding');
    expect(JSON.stringify(result).length).toBeLessThan(200);
  });

  it('contains no trade-control API', () => {
    expect(ADAPTER_SOURCE).not.toMatch(/startTrade/);
    expect(ADAPTER_SOURCE).not.toMatch(/stopTrade/);
    expect(ADAPTER_SOURCE).not.toMatch(/approveTrade/);
    expect(ADAPTER_SOURCE).not.toMatch(/rejectTrade/);
    expect(ADAPTER_SOURCE).not.toMatch(/executeTrade/);
    expect(ADAPTER_SOURCE).not.toMatch(/risk override|riskOverride/i);
    expect(ADAPTER_SOURCE).not.toMatch(/gate override|gateOverride/i);
    expect(ADAPTER_SOURCE).not.toMatch(/getUpdates/);
    expect(ADAPTER_SOURCE).not.toMatch(/setWebhook/);
    expect(ADAPTER_SOURCE).not.toMatch(/start trade|stop trade|approve trade/i);
  });

  it('does not implement the synchronous NotificationChannelPort send signature', () => {
    expect(ADAPTER_SOURCE).not.toMatch(/implements NotificationChannelPort/);
    expect(ADAPTER_SOURCE).toMatch(/async send\(/);
  });
});
