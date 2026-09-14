/**
 * REM-02 — On-demand Telegram getUpdates observer for chat binding.
 *
 * Chosen over webhook: no public inbound URL, no setWebhook, no workers/timers.
 * Complete() performs a single timeout=0 getUpdates call. Mocked in tests.
 * Does not process trading commands. Token is retrieved at observe time, never stored.
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../../identity/role';
import { findTelegramStartBind, TELEGRAM_BIND_NOT_OBSERVED } from '../domain/telegram-start-bind';
import { TelegramBotApiHttpClient } from './telegram-bot-api.http';
import { TelegramBotTokenResolver } from './telegram-bot-token.resolver';

export type TelegramStartBindObserveInput = Readonly<{
  workspaceId: string;
  expectedToken: string;
  actorUserId?: string;
  actorRole?: Role;
}>;

export type TelegramStartBindObserveResult =
  | Readonly<{ ok: true; chatId: string }>
  | Readonly<{ ok: false; detail: typeof TELEGRAM_BIND_NOT_OBSERVED }>;

type TelegramGetUpdatesEnvelope = {
  ok?: unknown;
  result?: unknown;
};

@Injectable()
export class TelegramStartBindObserver {
  constructor(
    @Inject(TelegramBotApiHttpClient)
    private readonly http: TelegramBotApiHttpClient,
    @Inject(TelegramBotTokenResolver)
    private readonly tokens: TelegramBotTokenResolver,
  ) {}

  async observeStartBind(
    input: TelegramStartBindObserveInput,
  ): Promise<TelegramStartBindObserveResult> {
    const expectedToken = input.expectedToken.trim();
    if (!expectedToken) {
      return notObserved();
    }

    const resolved = await this.tokens.resolve({
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
    });
    if (!resolved.ok) {
      return notObserved();
    }

    const http = await this.http.execute({
      botToken: resolved.botToken,
      method: 'getUpdates',
    });
    if (!http.ok || http.status !== 200) {
      return notObserved();
    }

    const parsed = parseGetUpdatesEnvelope(http.bodyText);
    if (!parsed) {
      return notObserved();
    }

    const bound = findTelegramStartBind(parsed, expectedToken);
    if (!bound.ok) {
      return notObserved();
    }
    return Object.freeze({ ok: true as const, chatId: bound.chatId });
  }
}

function notObserved(): TelegramStartBindObserveResult {
  return Object.freeze({ ok: false as const, detail: TELEGRAM_BIND_NOT_OBSERVED });
}

function parseGetUpdatesEnvelope(bodyText: string): readonly unknown[] | null {
  try {
    const parsed: unknown = JSON.parse(bodyText);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const envelope = parsed as TelegramGetUpdatesEnvelope;
    if (envelope.ok !== true || !Array.isArray(envelope.result)) {
      return null;
    }
    return envelope.result as readonly unknown[];
  } catch {
    return null;
  }
}
