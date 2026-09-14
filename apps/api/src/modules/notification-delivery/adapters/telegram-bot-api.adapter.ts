/**
 * REM-01-s1/s2 — Production Telegram Bot API adapter.
 *
 * Delivery only. No trading commands. No inbound Telegram processing.
 * Token is retrieved at send time and never stored on the adapter.
 * This adapter is not a customer-visible delivery proof.
 */

import { Inject, Injectable, Optional } from '@nestjs/common';
import type { LogContext, Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import { NoOpLogger } from '../../../logging/noop.logger';
import {
  parseProductionTelegramChatId,
  TELEGRAM_CHAT_ID_NOT_BOUND,
} from '../domain/production-telegram-chat-id';
import type {
  NotificationChannelPort,
  NotificationChannelSendCommand,
} from '../ports/notification.port';
import {
  mapTelegramHttpStatus,
  redactTelegramSecrets,
  type TelegramBotApiErrorCode,
} from './telegram-bot-api.errors';
import { TelegramBotApiHttpClient } from './telegram-bot-api.http';
import { TelegramBotTokenResolver } from './telegram-bot-token.resolver';

export type TelegramBotApiOperationResult =
  Readonly<{ ok: true }> | Readonly<{ ok: false; detail: TelegramBotApiErrorCode }>;

export type TelegramBotApiGetMeRequest = Readonly<{
  botToken: string;
  workspaceId?: string;
}>;

export type TelegramBotApiSendRequest = Readonly<{
  botToken: string;
  chatId: string;
  subject: string;
  body: string;
  workspaceId?: string;
}>;

type TelegramApiEnvelope = {
  ok?: unknown;
  result?: unknown;
};

@Injectable()
export class ProductionTelegramBotApiAdapter implements NotificationChannelPort {
  readonly channelId = 'telegram' as const;
  readonly active = true;

  private readonly http: TelegramBotApiHttpClient;
  private readonly tokens: TelegramBotTokenResolver | undefined;
  private readonly logger: Logger;

  constructor(
    @Inject(TelegramBotApiHttpClient)
    http: TelegramBotApiHttpClient = new TelegramBotApiHttpClient(),
    @Optional() @Inject(TelegramBotTokenResolver) tokens?: TelegramBotTokenResolver,
    @Optional() @Inject(LOGGER) logger?: Logger,
  ) {
    this.http = http;
    this.tokens = tokens;
    this.logger = logger?.child(ProductionTelegramBotApiAdapter.name) ?? new NoOpLogger();
  }

  async getMe(input: TelegramBotApiGetMeRequest): Promise<TelegramBotApiOperationResult> {
    const started = Date.now();
    const token = input.botToken.trim();
    if (!token) {
      return this.fail('getMe', 'telegram_invalid_request', started, input.workspaceId, token);
    }

    const http = await this.http.execute({ botToken: token, method: 'getMe' });
    if (!http.ok) {
      return this.fail('getMe', http.detail, started, input.workspaceId, token);
    }
    if (http.status !== 200) {
      return this.fail(
        'getMe',
        mapTelegramHttpStatus(http.status),
        started,
        input.workspaceId,
        token,
        http.status,
      );
    }

    const parsed = parseTelegramEnvelope(http.bodyText);
    if (!parsed || parsed.ok !== true) {
      return this.fail(
        'getMe',
        'telegram_invalid_response',
        started,
        input.workspaceId,
        token,
        http.status,
      );
    }

    this.logSuccess('getMe', started, input.workspaceId, http.status);
    return Object.freeze({ ok: true as const });
  }

  async sendMessage(input: TelegramBotApiSendRequest): Promise<TelegramBotApiOperationResult> {
    return this.dispatchSendMessage(input);
  }

  /**
   * NotificationChannelPort send: validate chat id, retrieve token, then Bot API.
   * Does not accept or store botToken on the port.
   */
  async send(cmd: NotificationChannelSendCommand): Promise<TelegramBotApiOperationResult> {
    const started = Date.now();
    const destination = parseProductionTelegramChatId(cmd.chatId);
    if (!destination.ok) {
      return this.fail('sendMessage', TELEGRAM_CHAT_ID_NOT_BOUND, started, cmd.workspaceId, '');
    }
    if (!this.tokens) {
      return this.fail('sendMessage', 'telegram_invalid_request', started, cmd.workspaceId, '');
    }
    const resolved = await this.tokens.resolve({
      workspaceId: cmd.workspaceId,
      actorUserId: cmd.actorUserId,
      actorRole: cmd.actorRole,
    });
    if (!resolved.ok) {
      return this.fail('sendMessage', resolved.detail, started, cmd.workspaceId, '');
    }
    return this.dispatchSendMessage({
      botToken: resolved.botToken,
      chatId: destination.chatId,
      subject: cmd.subject,
      body: cmd.body,
      workspaceId: cmd.workspaceId,
    });
  }

  private async dispatchSendMessage(
    input: TelegramBotApiSendRequest,
  ): Promise<TelegramBotApiOperationResult> {
    const started = Date.now();
    const token = input.botToken.trim();
    if (!token) {
      return this.fail(
        'sendMessage',
        'telegram_invalid_request',
        started,
        input.workspaceId,
        token,
      );
    }

    const destination = parseProductionTelegramChatId(input.chatId);
    if (!destination.ok) {
      return this.fail(
        'sendMessage',
        TELEGRAM_CHAT_ID_NOT_BOUND,
        started,
        input.workspaceId,
        token,
      );
    }

    const text = notificationText(input.subject, input.body);
    if (!text) {
      return this.fail(
        'sendMessage',
        'telegram_invalid_request',
        started,
        input.workspaceId,
        token,
      );
    }

    const http = await this.http.execute({
      botToken: token,
      method: 'sendMessage',
      jsonBody: { chat_id: destination.chatId, text },
    });
    if (!http.ok) {
      return this.fail('sendMessage', http.detail, started, input.workspaceId, token);
    }
    if (http.status !== 200) {
      return this.fail(
        'sendMessage',
        mapTelegramHttpStatus(http.status),
        started,
        input.workspaceId,
        token,
        http.status,
      );
    }

    const parsed = parseTelegramEnvelope(http.bodyText);
    if (!parsed || parsed.ok !== true || !hasMessageId(parsed.result)) {
      return this.fail(
        'sendMessage',
        'telegram_invalid_response',
        started,
        input.workspaceId,
        token,
        http.status,
      );
    }

    this.logSuccess('sendMessage', started, input.workspaceId, http.status);
    return Object.freeze({ ok: true as const });
  }

  private fail(
    operation: 'getMe' | 'sendMessage',
    detail: TelegramBotApiErrorCode,
    started: number,
    workspaceId: string | undefined,
    botToken: string,
    vendorStatus?: number,
  ): TelegramBotApiOperationResult {
    this.logger.warn(
      'telegram_bot_api_failed',
      safeLogContext(operation, started, workspaceId, vendorStatus, detail, botToken),
    );
    return Object.freeze({ ok: false as const, detail });
  }

  private logSuccess(
    operation: 'getMe' | 'sendMessage',
    started: number,
    workspaceId: string | undefined,
    vendorStatus: number,
  ): void {
    this.logger.info(
      'telegram_bot_api_succeeded',
      safeLogContext(operation, started, workspaceId, vendorStatus, undefined, ''),
    );
  }
}

function notificationText(subject: string, body: string): string {
  return [subject, body]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join('\n\n');
}

function parseTelegramEnvelope(bodyText: string): TelegramApiEnvelope | null {
  try {
    const parsed: unknown = JSON.parse(bodyText);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as TelegramApiEnvelope;
  } catch {
    return null;
  }
}

function hasMessageId(result: unknown): boolean {
  if (result === null || typeof result !== 'object' || Array.isArray(result)) {
    return false;
  }
  const messageId = (result as { message_id?: unknown }).message_id;
  return (
    typeof messageId === 'number' || (typeof messageId === 'string' && messageId.trim() !== '')
  );
}

function safeLogContext(
  operation: 'getMe' | 'sendMessage',
  started: number,
  workspaceId: string | undefined,
  vendorStatus: number | undefined,
  detail: TelegramBotApiErrorCode | undefined,
  botToken: string,
): LogContext {
  const context: LogContext = {
    channelId: 'telegram',
    operation,
    durationMs: Date.now() - started,
  };
  if (workspaceId) context.workspaceId = workspaceId;
  if (vendorStatus !== undefined) context.vendorStatus = vendorStatus;
  if (detail) context.errorClassification = detail;
  return JSON.parse(redactTelegramSecrets(JSON.stringify(context), botToken)) as LogContext;
}
