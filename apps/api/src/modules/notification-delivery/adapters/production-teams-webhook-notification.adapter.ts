/**
 * Production Microsoft Teams Incoming Webhook notification adapter.
 *
 * Delivery only. Webhook URL retrieved at send time and never stored on the
 * adapter. Connected is defined by successful HTTPS POST returning HTTP 202.
 * Outbound only — no Bot Framework, Graph, OAuth, or inbound receivers.
 * Payload is exactly {"text":"<non-empty ≤4000>"}. Adaptive Cards / MessageCards
 * are out of scope.
 */

import { Inject, Injectable, Optional } from '@nestjs/common';
import { validateTeamsIncomingWebhookUrl } from '../../../security-platform/teams-webhook-url-guard';
import type { LogContext, Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import { NoOpLogger } from '../../../logging/noop.logger';
import type {
  NotificationChannelPort,
  NotificationChannelSendCommand,
} from '../ports/notification.port';
import { TeamsWebhookCredentialResolver } from './teams-webhook-credential.resolver';
import {
  classifyTeamsWebhookHttpStatus,
  classifyTeamsWebhookTransportError,
  isTeamsAbortError,
  redactTeamsWebhookSecrets,
  type TeamsWebhookNotificationErrorCode,
} from './teams-webhook-notification.errors';

export const TEAMS_WEBHOOK_FETCH = Symbol('TEAMS_WEBHOOK_FETCH');
export const TEAMS_WEBHOOK_TIMEOUT_MS = 10_000;
export const MAX_TEAMS_WEBHOOK_RESPONSE_CHARS = 256;
export const MAX_TEAMS_WEBHOOK_TEXT_CHARS = 4000;

export type TeamsWebhookNotificationOperationResult =
  Readonly<{ ok: true }> | Readonly<{ ok: false; detail: TeamsWebhookNotificationErrorCode }>;

export type TeamsWebhookFetch = (
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
export class ProductionTeamsWebhookNotificationAdapter implements NotificationChannelPort {
  readonly channelId = 'teams' as const;
  readonly active = true;

  private readonly credentials: TeamsWebhookCredentialResolver | undefined;
  private readonly logger: Logger;
  private readonly fetchFn: TeamsWebhookFetch;
  private readonly timeoutMs: number;

  constructor(
    @Optional()
    @Inject(TeamsWebhookCredentialResolver)
    credentials?: TeamsWebhookCredentialResolver,
    @Optional() @Inject(LOGGER) logger?: Logger,
    @Optional() @Inject(TEAMS_WEBHOOK_FETCH) fetchFn?: TeamsWebhookFetch,
  ) {
    this.credentials = credentials;
    this.logger = logger?.child(ProductionTeamsWebhookNotificationAdapter.name) ?? new NoOpLogger();
    this.fetchFn = fetchFn ?? (fetch as TeamsWebhookFetch);
    this.timeoutMs = TEAMS_WEBHOOK_TIMEOUT_MS;
  }

  async send(
    cmd: NotificationChannelSendCommand,
  ): Promise<TeamsWebhookNotificationOperationResult> {
    const started = Date.now();
    if (!this.credentials) {
      return this.fail('send', 'teams_webhook_invalid_request', started, cmd.workspaceId);
    }

    const subject = cmd.subject.trim();
    const body = cmd.body.trim();
    const text = [subject, body].filter((part) => part.length > 0).join('\n\n');
    if (!text) {
      return this.fail('send', 'teams_webhook_invalid_request', started, cmd.workspaceId);
    }
    if ([...text].length > MAX_TEAMS_WEBHOOK_TEXT_CHARS) {
      return this.fail('send', 'teams_webhook_invalid_request', started, cmd.workspaceId);
    }

    const resolved = await this.credentials.resolve({
      workspaceId: cmd.workspaceId,
      actorUserId: cmd.actorUserId,
      actorRole: cmd.actorRole,
    });
    if (!resolved.ok) {
      return this.fail('send', resolved.detail, started, cmd.workspaceId);
    }

    const guard = validateTeamsIncomingWebhookUrl(resolved.credential.webhookUrl);
    if (!guard.ok) {
      return this.fail(
        'send',
        'teams_webhook_blocked_url',
        started,
        cmd.workspaceId,
        resolved.credential,
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      // Use preservedUrl — never rewrite/reorder/re-encode the credential query.
      const response = await this.fetchFn(guard.preservedUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ text }),
        redirect: 'error',
        signal: controller.signal,
      });
      // Drain body for completeness; content is never logged.
      await response.text().then((raw) => raw.slice(0, MAX_TEAMS_WEBHOOK_RESPONSE_CHARS));
      const statusClass = classifyTeamsWebhookHttpStatus(response.status);
      if (statusClass !== 'ok') {
        return this.fail('send', statusClass, started, cmd.workspaceId, resolved.credential);
      }
      this.logSuccess(started, cmd.workspaceId);
      return Object.freeze({ ok: true as const });
    } catch (error) {
      if (isTeamsAbortError(error) || controller.signal.aborted) {
        return this.fail(
          'send',
          'teams_webhook_timeout',
          started,
          cmd.workspaceId,
          resolved.credential,
        );
      }
      return this.fail(
        'send',
        classifyTeamsWebhookTransportError(error),
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
    detail: TeamsWebhookNotificationErrorCode,
    started: number,
    workspaceId: string | undefined,
    secrets?: Readonly<{ webhookUrl?: string }>,
  ): TeamsWebhookNotificationOperationResult {
    this.logger.warn(
      'teams_webhook_notification_failed',
      safeLogContext(operation, started, workspaceId, detail, secrets),
    );
    return Object.freeze({ ok: false as const, detail });
  }

  private logSuccess(started: number, workspaceId: string | undefined): void {
    this.logger.info(
      'teams_webhook_notification_succeeded',
      safeLogContext('send', started, workspaceId, undefined, undefined),
    );
  }
}

function safeLogContext(
  operation: 'send',
  started: number,
  workspaceId: string | undefined,
  detail: TeamsWebhookNotificationErrorCode | undefined,
  secrets: Readonly<{ webhookUrl?: string }> | undefined,
): LogContext {
  const context: LogContext = {
    channelId: 'teams',
    operation,
    durationMs: Date.now() - started,
  };
  if (workspaceId) context.workspaceId = workspaceId;
  if (detail) context.errorClassification = detail;
  return JSON.parse(
    redactTeamsWebhookSecrets(JSON.stringify(context), secrets ?? {}),
  ) as LogContext;
}
