/**
 * Production Slack Incoming Webhook notification adapter.
 *
 * Delivery only. Webhook URL retrieved at send time and never stored on the
 * adapter. Connected is defined by successful HTTPS POST (200 + body ok).
 * Outbound only — no Events API, bot tokens, or inbound receivers.
 */

import { Inject, Injectable, Optional } from '@nestjs/common';
import { validateSlackIncomingWebhookUrl } from '../../../security-platform/slack-webhook-url-guard';
import type { LogContext, Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import { NoOpLogger } from '../../../logging/noop.logger';
import type {
  NotificationChannelPort,
  NotificationChannelSendCommand,
} from '../ports/notification.port';
import { SlackWebhookCredentialResolver } from './slack-webhook-credential.resolver';
import {
  classifySlackWebhookHttpStatus,
  classifySlackWebhookTransportError,
  isSlackAbortError,
  redactSlackWebhookSecrets,
  type SlackWebhookNotificationErrorCode,
} from './slack-webhook-notification.errors';

export const SLACK_WEBHOOK_FETCH = Symbol('SLACK_WEBHOOK_FETCH');
export const SLACK_WEBHOOK_TIMEOUT_MS = 10_000;
export const MAX_SLACK_WEBHOOK_RESPONSE_CHARS = 256;
export const MAX_SLACK_WEBHOOK_TEXT_CHARS = 4096;

export type SlackWebhookNotificationOperationResult =
  Readonly<{ ok: true }> | Readonly<{ ok: false; detail: SlackWebhookNotificationErrorCode }>;

export type SlackWebhookFetch = (
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
export class ProductionSlackWebhookNotificationAdapter implements NotificationChannelPort {
  readonly channelId = 'slack' as const;
  readonly active = true;

  private readonly credentials: SlackWebhookCredentialResolver | undefined;
  private readonly logger: Logger;
  private readonly fetchFn: SlackWebhookFetch;
  private readonly timeoutMs: number;

  constructor(
    @Optional()
    @Inject(SlackWebhookCredentialResolver)
    credentials?: SlackWebhookCredentialResolver,
    @Optional() @Inject(LOGGER) logger?: Logger,
    @Optional() @Inject(SLACK_WEBHOOK_FETCH) fetchFn?: SlackWebhookFetch,
  ) {
    this.credentials = credentials;
    this.logger = logger?.child(ProductionSlackWebhookNotificationAdapter.name) ?? new NoOpLogger();
    this.fetchFn = fetchFn ?? (fetch as SlackWebhookFetch);
    this.timeoutMs = SLACK_WEBHOOK_TIMEOUT_MS;
  }

  async send(
    cmd: NotificationChannelSendCommand,
  ): Promise<SlackWebhookNotificationOperationResult> {
    const started = Date.now();
    if (!this.credentials) {
      return this.fail('send', 'slack_webhook_invalid_request', started, cmd.workspaceId);
    }

    const subject = cmd.subject.trim();
    const body = cmd.body.trim();
    const text = [subject, body]
      .filter((part) => part.length > 0)
      .join('\n\n')
      .slice(0, MAX_SLACK_WEBHOOK_TEXT_CHARS);
    if (!text) {
      return this.fail('send', 'slack_webhook_invalid_request', started, cmd.workspaceId);
    }

    const resolved = await this.credentials.resolve({
      workspaceId: cmd.workspaceId,
      actorUserId: cmd.actorUserId,
      actorRole: cmd.actorRole,
    });
    if (!resolved.ok) {
      return this.fail('send', resolved.detail, started, cmd.workspaceId);
    }

    const guard = validateSlackIncomingWebhookUrl(resolved.credential.webhookUrl);
    if (!guard.ok) {
      return this.fail(
        'send',
        'slack_webhook_blocked_url',
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
        body: JSON.stringify({ text }),
        redirect: 'error',
        signal: controller.signal,
      });
      const raw = (await response.text()).slice(0, MAX_SLACK_WEBHOOK_RESPONSE_CHARS);
      const statusClass = classifySlackWebhookHttpStatus(response.status);
      if (statusClass !== 'ok') {
        return this.fail('send', statusClass, started, cmd.workspaceId, resolved.credential);
      }
      if (raw.trim() !== 'ok') {
        return this.fail(
          'send',
          'slack_webhook_invalid_response',
          started,
          cmd.workspaceId,
          resolved.credential,
        );
      }
      this.logSuccess(started, cmd.workspaceId);
      return Object.freeze({ ok: true as const });
    } catch (error) {
      if (isSlackAbortError(error) || controller.signal.aborted) {
        return this.fail(
          'send',
          'slack_webhook_timeout',
          started,
          cmd.workspaceId,
          resolved.credential,
        );
      }
      return this.fail(
        'send',
        classifySlackWebhookTransportError(error),
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
    detail: SlackWebhookNotificationErrorCode,
    started: number,
    workspaceId: string | undefined,
    secrets?: Readonly<{ webhookUrl?: string }>,
  ): SlackWebhookNotificationOperationResult {
    this.logger.warn(
      'slack_webhook_notification_failed',
      safeLogContext(operation, started, workspaceId, detail, secrets),
    );
    return Object.freeze({ ok: false as const, detail });
  }

  private logSuccess(started: number, workspaceId: string | undefined): void {
    this.logger.info(
      'slack_webhook_notification_succeeded',
      safeLogContext('send', started, workspaceId, undefined, undefined),
    );
  }
}

function safeLogContext(
  operation: 'send',
  started: number,
  workspaceId: string | undefined,
  detail: SlackWebhookNotificationErrorCode | undefined,
  secrets: Readonly<{ webhookUrl?: string }> | undefined,
): LogContext {
  const context: LogContext = {
    channelId: 'slack',
    operation,
    durationMs: Date.now() - started,
  };
  if (workspaceId) context.workspaceId = workspaceId;
  if (detail) context.errorClassification = detail;
  return JSON.parse(
    redactSlackWebhookSecrets(JSON.stringify(context), secrets ?? {}),
  ) as LogContext;
}
