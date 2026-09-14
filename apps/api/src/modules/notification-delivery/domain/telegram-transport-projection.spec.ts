import { describe, expect, it, vi } from 'vitest';
import { InMemoryTelegramAdapter } from '../adapters/in-memory-telegram.adapter';
import { ProductionTelegramBotApiAdapter } from '../adapters/telegram-bot-api.adapter';
import type { NotificationChannelPort } from '../ports/notification.port';
import {
  BOT_API_TELEGRAM_TRANSPORT,
  IN_MEMORY_TELEGRAM_TRANSPORT,
  projectTelegramTransport,
} from './telegram-transport-projection';

describe('projectTelegramTransport (REM-03)', () => {
  it('classifies ProductionTelegramBotApiAdapter as bot-api without sending or retrieving tokens', () => {
    const adapter = new ProductionTelegramBotApiAdapter();
    const send = vi.spyOn(adapter, 'send');
    const getMe = vi.spyOn(adapter, 'getMe');

    expect(projectTelegramTransport(adapter)).toEqual(BOT_API_TELEGRAM_TRANSPORT);
    expect(projectTelegramTransport(adapter).transport).toBe('bot-api');
    expect(projectTelegramTransport(adapter).botApiUsed).toBe(true);
    expect(send).not.toHaveBeenCalled();
    expect(getMe).not.toHaveBeenCalled();
  });

  it('classifies InMemoryTelegramAdapter as in-memory without sending', () => {
    const adapter = new InMemoryTelegramAdapter();
    const send = vi.spyOn(adapter, 'send');

    expect(projectTelegramTransport(adapter)).toEqual(IN_MEMORY_TELEGRAM_TRANSPORT);
    expect(projectTelegramTransport(adapter).transport).toBe('in-memory');
    expect(projectTelegramTransport(adapter).botApiUsed).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(adapter.listSent()).toHaveLength(0);
  });

  it('does not globally hard-code bot-api for an unknown channel port', () => {
    const unknown: NotificationChannelPort = {
      channelId: 'telegram',
      active: true,
      send: async () => ({ ok: true }),
    };

    expect(projectTelegramTransport(unknown)).toEqual(IN_MEMORY_TELEGRAM_TRANSPORT);
  });
});
