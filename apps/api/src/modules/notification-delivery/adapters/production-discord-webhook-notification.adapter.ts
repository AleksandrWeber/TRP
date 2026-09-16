/**
 * Production Discord Incoming Webhook notification adapter.
 *
 * Delivery only. Webhook URL retrieved at send time and never stored on the
 * adapter. Connected is defined by successful HTTPS POST returning HTTP 204.
 * Outbound only — no Bot API, Gateway, OAuth, or inbound receivers.
 */

import { Inject, Injectable, Optional } from '@nestjs/common';
import { validateDiscordIncomingWebhookUrl } from '../../../security-platform/discord-webhook-url-guard';
import type { LogContext, Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import { NoOpLogger } from '../../../logging/noop.logger';
import type {
  NotificationChannelPort,
  NotificationChannelSendCommand,
} from '../ports/notification.port';
import { DiscordWebhookCredentialResolver } from './discord-webhook-credential.resolver';
import {
  classifyDiscordWebhookHttpStatus,
  classifyDiscordWebhookTransportError,
  isDiscordAbortError,
  redactDiscordWebhookSecrets,
  type DiscordWebhookNotificationErrorCode,
} from './discord-webhook-notification.errors';

export const DISCORD_WEBHOOK_FETCH = Symbol('DISCORD_WEBHOOK_FETCH');
export const DISCORD_WEBHOOK_TIMEOUT_MS = 10_000;
export const MAX_DISCORD_WEBHOOK_RESPONSE_CHARS = 256;
export const MAX_DISCORD_WEBHOOK_CONTENT_CHARS = 2000;

export type DiscordWebhookNotificationOperationResult =
  Readonly<{ ok: true }> | Readonly<{ ok: false; detail: DiscordWebhookNotificationErrorCode }>;

export type DiscordWebhookFetch = (
  input: string,
  init: {
    method: 'POST';
    headers: Readonly<Record<string, string>>;
    body: string;
    redirect: 'error';
    signal: AbortSignal;
  },
) => Promise<{ status: number; text(): Promise<string> }>;

@Injectable()
export class ProductionDiscordWebhookNotificationAdapter implements NotificationChannelPort {
  readonly channelId = 'discord' as const;
  readonly active = true;

  private readonly credentials: DiscordWebhookCredentialResolver | undefined;
  private readonly logger: Logger;
  private readonly fetchFn: DiscordWebhookFetch;
  private readonly timeoutMs: number;

  constructor(
    @Optional()
    @Inject(DiscordWebhookCredentialResolver)
    credentials?: DiscordWebhookCredentialResolver,
    @Optional() @Inject(LOGGER) logger?: Logger,
    @Optional() @Inject(DISCORD_WEBHOOK_FETCH) fetchFn?: DiscordWebhookFetch,
  ) {
    this.credentials = credentials;
    this.logger =
      logger?.child(ProductionDiscordWebhookNotificationAdapter.name) ?? new NoOpLogger();
    this.fetchFn = fetchFn ?? (fetch as DiscordWebhookFetch);
    this.timeoutMs = DISCORD_WEBHOOK_TIMEOUT_MS;
  }

  async send(
    cmd: NotificationChannelSendCommand,
  ): Promise<DiscordWebhookNotificationOperationResult> {
    const started = Date.now();
    if (!this.credentials) {
      return this.fail('send', 'discord_webhook_invalid_request', started, cmd.workspaceId);
    }

    const subject = cmd.subject.trim();
    const body = cmd.body.trim();
    const content = [subject, body]
      .filter((part) => part.length > 0)
      .join('\n\n')
      .slice(0, MAX_DISCORD_WEBHOOK_CONTENT_CHARS);
    if (!content) {
      return this.fail('send', 'discord_webhook_invalid_request', started, cmd.workspaceId);
    }

    const resolved = await this.credentials.resolve({
      workspaceId: cmd.workspaceId,
      actorUserId: cmd.actorUserId,
      actorRole: cmd.actorRole,
    });
    if (!resolved.ok) {
      return this.fail('send', resolved.detail, started, cmd.workspaceId);
    }

    const guard = validateDiscordIncomingWebhookUrl(resolved.credential.webhookUrl);
    if (!guard.ok) {
      return this.fail(
        'send',
        'discord_webhook_blocked_url',
        started,
        cmd.workspaceId,
        resolved.credential,
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchFn(guard.url.toString(), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content }),
        redirect: 'error',
        signal: controller.signal,
      });
      // Drain body for completeness; content is never logged.
      await response.text().then((raw) => raw.slice(0, MAX_DISCORD_WEBHOOK_RESPONSE_CHARS));
      const statusClass = classifyDiscordWebhookHttpStatus(response.status);
      if (statusClass !== 'ok') {
        return this.fail('send', statusClass, started, cmd.workspaceId, resolved.credential);
      }
      this.logSuccess(started, cmd.workspaceId);
      return Object.freeze({ ok: true as const });
    } catch (error) {
      if (isDiscordAbortError(error) || controller.signal.aborted) {
        return this.fail(
          'send',
          'discord_webhook_timeout',
          started,
          cmd.workspaceId,
          resolved.credential,
        );
      }
      return this.fail(
        'send',
        classifyDiscordWebhookTransportError(error),
        started,
        cmd.workspaceId,
        resolved.credential,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private fail(
    operation: 'send',
    detail: DiscordWebhookNotificationErrorCode,
    started: number,
    workspaceId: string | undefined,
    secrets?: Readonly<{ webhookUrl?: string }>,
  ): DiscordWebhookNotificationOperationResult {
    this.logger.warn(
      'discord_webhook_notification_failed',
      safeLogContext(operation, started, workspaceId, detail, secrets),
    );
    return Object.freeze({ ok: false as const, detail });
  }

  private logSuccess(started: number, workspaceId: string | undefined): void {
    this.logger.info(
      'discord_webhook_notification_succeeded',
      safeLogContext('send', started, workspaceId, undefined, undefined),
    );
  }
}

function safeLogContext(
  operation: 'send',
  started: number,
  workspaceId: string | undefined,
  detail: DiscordWebhookNotificationErrorCode | undefined,
  secrets: Readonly<{ webhookUrl?: string }> | undefined,
): LogContext {
  const context: LogContext = {
    channelId: 'discord',
    operation,
    durationMs: Date.now() - started,
  };
  if (workspaceId) context.workspaceId = workspaceId;
  if (detail) context.errorClassification = detail;
  return JSON.parse(
    redactDiscordWebhookSecrets(JSON.stringify(context), secrets ?? {}),
  ) as LogContext;
}
