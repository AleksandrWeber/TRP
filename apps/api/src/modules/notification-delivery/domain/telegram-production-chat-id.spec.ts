import { describe, expect, it } from 'vitest';
import {
  parseProductionTelegramChatId,
  TELEGRAM_CHAT_ID_NOT_BOUND,
} from './telegram-production-chat-id';

describe('parseProductionTelegramChatId (REM-01-s1)', () => {
  it('rejects empty and whitespace chat ids', () => {
    expect(parseProductionTelegramChatId('')).toEqual({
      ok: false,
      detail: TELEGRAM_CHAT_ID_NOT_BOUND,
    });
    expect(parseProductionTelegramChatId('   ')).toEqual({
      ok: false,
      detail: TELEGRAM_CHAT_ID_NOT_BOUND,
    });
  });

  it('rejects in-memory synthetic destinations', () => {
    expect(parseProductionTelegramChatId('in-memory:workspace-a:user-a')).toEqual({
      ok: false,
      detail: TELEGRAM_CHAT_ID_NOT_BOUND,
    });
    expect(parseProductionTelegramChatId('in-memory:ws:user')).toEqual({
      ok: false,
      detail: TELEGRAM_CHAT_ID_NOT_BOUND,
    });
    expect(parseProductionTelegramChatId('in-memory:anything')).toEqual({
      ok: false,
      detail: TELEGRAM_CHAT_ID_NOT_BOUND,
    });
  });

  it('rejects chat-auto-42 and other non-numeric identifiers', () => {
    expect(parseProductionTelegramChatId('chat-auto-42')).toEqual({
      ok: false,
      detail: TELEGRAM_CHAT_ID_NOT_BOUND,
    });
    expect(parseProductionTelegramChatId('abc')).toEqual({
      ok: false,
      detail: TELEGRAM_CHAT_ID_NOT_BOUND,
    });
    expect(parseProductionTelegramChatId('+123')).toEqual({
      ok: false,
      detail: TELEGRAM_CHAT_ID_NOT_BOUND,
    });
    expect(parseProductionTelegramChatId('12.3')).toEqual({
      ok: false,
      detail: TELEGRAM_CHAT_ID_NOT_BOUND,
    });
  });

  it('accepts positive and negative numeric Telegram chat ids', () => {
    expect(parseProductionTelegramChatId('123456789')).toEqual({ ok: true, chatId: '123456789' });
    expect(parseProductionTelegramChatId('  -1001234567890  ')).toEqual({
      ok: true,
      chatId: '-1001234567890',
    });
  });
});
