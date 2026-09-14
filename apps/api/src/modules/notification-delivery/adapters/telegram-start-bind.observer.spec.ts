import { describe, expect, it, vi } from 'vitest';
import { Role } from '../../identity/role';
import { TELEGRAM_BIND_NOT_OBSERVED } from '../domain/telegram-start-bind';
import { TelegramBotApiHttpClient } from './telegram-bot-api.http';
import { TelegramStartBindObserver } from './telegram-start-bind.observer';

const TOKEN = '123456:OBSERVER-TEST-TOKEN';
const BIND_TOKEN = 'tg-token';

function jsonFetch(body: unknown, status = 200) {
  return async (url: string) => {
    expect(url).toContain('https://api.telegram.org/bot');
    expect(url).toContain('/getUpdates');
    expect(url).toContain('timeout=0');
    expect(url).not.toContain(BIND_TOKEN);
    return { status, text: async () => JSON.stringify(body) };
  };
}

describe('TelegramStartBindObserver (REM-02, MOCKED / DETERMINISTIC)', () => {
  it('returns numeric chat.id from a mocked getUpdates /start payload', async () => {
    const observer = new TelegramStartBindObserver(
      new TelegramBotApiHttpClient(
        jsonFetch({
          ok: true,
          result: [{ update_id: 7, message: { chat: { id: 4242 }, text: '/start tg-token' } }],
        }),
      ),
      { resolve: async () => ({ ok: true as const, botToken: TOKEN }) } as never,
    );
    const result = await observer.observeStartBind({
      workspaceId: 'ws-1',
      expectedToken: BIND_TOKEN,
      actorUserId: 'user-1',
      actorRole: Role.Trader,
    });
    expect(result).toEqual({ ok: true, chatId: '4242' });
    expect(JSON.stringify(result)).not.toContain(TOKEN);
  });

  it('fails closed without calling Telegram when Vault retrieve is denied', async () => {
    const fetchFn = vi.fn();
    const observer = new TelegramStartBindObserver(new TelegramBotApiHttpClient(fetchFn), {
      resolve: async () => ({ ok: false as const, detail: 'telegram_invalid_request' }),
    } as never);
    const result = await observer.observeStartBind({
      workspaceId: 'ws-1',
      expectedToken: BIND_TOKEN,
      actorUserId: 'user-1',
      actorRole: Role.Researcher,
    });
    expect(result).toEqual({ ok: false, detail: TELEGRAM_BIND_NOT_OBSERVED });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('fails closed on unmatched token, control-plane commands, and synthetic chat ids', async () => {
    const unmatched = new TelegramStartBindObserver(
      new TelegramBotApiHttpClient(
        jsonFetch({
          ok: true,
          result: [{ update_id: 1, message: { chat: { id: 1 }, text: '/start other' } }],
        }),
      ),
      { resolve: async () => ({ ok: true as const, botToken: TOKEN }) } as never,
    );
    await expect(
      unmatched.observeStartBind({
        workspaceId: 'ws-1',
        expectedToken: BIND_TOKEN,
        actorUserId: 'user-1',
        actorRole: Role.Trader,
      }),
    ).resolves.toEqual({ ok: false, detail: TELEGRAM_BIND_NOT_OBSERVED });

    const control = new TelegramStartBindObserver(
      new TelegramBotApiHttpClient(
        jsonFetch({
          ok: true,
          result: [{ update_id: 1, message: { chat: { id: 1 }, text: '/start stop-trading' } }],
        }),
      ),
      { resolve: async () => ({ ok: true as const, botToken: TOKEN }) } as never,
    );
    await expect(
      control.observeStartBind({
        workspaceId: 'ws-1',
        expectedToken: BIND_TOKEN,
        actorUserId: 'user-1',
        actorRole: Role.Trader,
      }),
    ).resolves.toEqual({ ok: false, detail: TELEGRAM_BIND_NOT_OBSERVED });

    const synthetic = new TelegramStartBindObserver(
      new TelegramBotApiHttpClient(
        jsonFetch({
          ok: true,
          result: [
            {
              update_id: 1,
              message: { chat: { id: 'in-memory:ws-1:user-1' }, text: '/start tg-token' },
            },
          ],
        }),
      ),
      { resolve: async () => ({ ok: true as const, botToken: TOKEN }) } as never,
    );
    await expect(
      synthetic.observeStartBind({
        workspaceId: 'ws-1',
        expectedToken: BIND_TOKEN,
        actorUserId: 'user-1',
        actorRole: Role.Trader,
      }),
    ).resolves.toEqual({ ok: false, detail: TELEGRAM_BIND_NOT_OBSERVED });
  });

  it('does not leak the bot token on invalid getUpdates envelopes', async () => {
    const observer = new TelegramStartBindObserver(
      new TelegramBotApiHttpClient(jsonFetch({ ok: false, description: `secret ${TOKEN}` })),
      { resolve: async () => ({ ok: true as const, botToken: TOKEN }) } as never,
    );
    const result = await observer.observeStartBind({
      workspaceId: 'ws-1',
      expectedToken: BIND_TOKEN,
      actorUserId: 'user-1',
      actorRole: Role.Trader,
    });
    expect(result).toEqual({ ok: false, detail: TELEGRAM_BIND_NOT_OBSERVED });
    expect(JSON.stringify(result)).not.toContain(TOKEN);
  });
});
