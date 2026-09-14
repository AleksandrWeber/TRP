import { describe, expect, it } from 'vitest';
import { TELEGRAM_CHAT_ID_NOT_BOUND } from './production-telegram-chat-id';
import {
  extractTelegramBindFromUpdate,
  findTelegramStartBind,
  isTelegramControlPlaneStartPayload,
  normalizeTelegramStartPayload,
  parseTelegramStartCommand,
  TELEGRAM_BIND_AMBIGUOUS,
  TELEGRAM_BIND_CONTROL_PLANE_REJECTED,
  TELEGRAM_BIND_INVALID_UPDATE,
  TELEGRAM_BIND_NOT_OBSERVED,
  TELEGRAM_BIND_TOKEN_MISMATCH,
} from './telegram-start-bind';

const TOKEN = 'tg-token';

function startUpdate(chatId: number | string, text: string) {
  return { update_id: 1, message: { chat: { id: chatId }, text } };
}

describe('telegram-start-bind (REM-02, MOCKED / DETERMINISTIC)', () => {
  it('parses /start payload and deep-link prefix', () => {
    expect(parseTelegramStartCommand('/start tg-token')).toEqual({
      ok: true,
      payload: 'tg-token',
    });
    expect(parseTelegramStartCommand('/start@MyBot tg-token')).toEqual({
      ok: true,
      payload: 'tg-token',
    });
    expect(parseTelegramStartCommand('/start tg://connect/tg-token')).toEqual({
      ok: true,
      payload: 'tg-token',
    });
    expect(parseTelegramStartCommand('/start')).toEqual({ ok: false });
    expect(parseTelegramStartCommand('hello')).toEqual({ ok: false });
    expect(normalizeTelegramStartPayload('tg://connect/tg-token')).toBe('tg-token');
  });

  it('extracts numeric chat.id from a matching /start update', () => {
    expect(extractTelegramBindFromUpdate(startUpdate(123456789, '/start tg-token'), TOKEN)).toEqual(
      {
        ok: true,
        chatId: '123456789',
        connectionToken: TOKEN,
      },
    );
    expect(
      extractTelegramBindFromUpdate(startUpdate(-1001234567890, '/start tg-token'), TOKEN),
    ).toEqual({
      ok: true,
      chatId: '-1001234567890',
      connectionToken: TOKEN,
    });
  });

  it('rejects missing, malformed, and unmatched payloads', () => {
    expect(extractTelegramBindFromUpdate(null, TOKEN)).toEqual({
      ok: false,
      detail: TELEGRAM_BIND_INVALID_UPDATE,
    });
    expect(extractTelegramBindFromUpdate({ update_id: 1 }, TOKEN)).toEqual({
      ok: false,
      detail: TELEGRAM_BIND_INVALID_UPDATE,
    });
    expect(extractTelegramBindFromUpdate(startUpdate(1, '/start other-token'), TOKEN)).toEqual({
      ok: false,
      detail: TELEGRAM_BIND_TOKEN_MISMATCH,
    });
    expect(extractTelegramBindFromUpdate(startUpdate(1, 'not a command'), TOKEN)).toEqual({
      ok: false,
      detail: TELEGRAM_BIND_NOT_OBSERVED,
    });
    expect(extractTelegramBindFromUpdate(startUpdate(1, '/start tg-token'), '')).toEqual({
      ok: false,
      detail: TELEGRAM_BIND_INVALID_UPDATE,
    });
  });

  it('rejects invalid and synthetic chat ids even when the token matches', () => {
    expect(
      extractTelegramBindFromUpdate(startUpdate('in-memory:ws:user', '/start tg-token'), TOKEN),
    ).toEqual({
      ok: false,
      detail: TELEGRAM_CHAT_ID_NOT_BOUND,
    });
    expect(
      extractTelegramBindFromUpdate(startUpdate('chat-auto-42', '/start tg-token'), TOKEN),
    ).toEqual({
      ok: false,
      detail: TELEGRAM_CHAT_ID_NOT_BOUND,
    });
    expect(extractTelegramBindFromUpdate(startUpdate('abc', '/start tg-token'), TOKEN)).toEqual({
      ok: false,
      detail: TELEGRAM_CHAT_ID_NOT_BOUND,
    });
  });

  it('rejects trading / control-plane /start commands', () => {
    expect(isTelegramControlPlaneStartPayload('stop-trading')).toBe(true);
    expect(isTelegramControlPlaneStartPayload('approve-trade')).toBe(true);
    expect(isTelegramControlPlaneStartPayload('execute-trade')).toBe(true);
    expect(
      extractTelegramBindFromUpdate(startUpdate(1, '/start stop-trading'), 'stop-trading'),
    ).toEqual({
      ok: false,
      detail: TELEGRAM_BIND_CONTROL_PLANE_REJECTED,
    });
    expect(findTelegramStartBind([startUpdate(1, '/start execute-trade')], TOKEN)).toEqual({
      ok: false,
      detail: TELEGRAM_BIND_CONTROL_PLANE_REJECTED,
    });
  });

  it('finds a matching update among unrelated messages and rejects ambiguous chat ids', () => {
    expect(
      findTelegramStartBind(
        [
          startUpdate(9, 'hello'),
          startUpdate(42, '/start tg-token'),
          startUpdate(8, '/start other'),
        ],
        TOKEN,
      ),
    ).toEqual({
      ok: true,
      chatId: '42',
      connectionToken: TOKEN,
    });
    expect(
      findTelegramStartBind(
        [startUpdate(1, '/start tg-token'), startUpdate(2, '/start tg-token')],
        TOKEN,
      ),
    ).toEqual({
      ok: false,
      detail: TELEGRAM_BIND_AMBIGUOUS,
    });
    expect(findTelegramStartBind([], TOKEN)).toEqual({
      ok: false,
      detail: TELEGRAM_BIND_NOT_OBSERVED,
    });
  });
});
