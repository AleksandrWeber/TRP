/**
 * Production Web Push + VAPID notification adapter.
 *
 * Delivery only. VAPID credentials retrieved at send time and never stored on
 * the adapter. Connected is defined by successful HTTPS Web Push (HTTP 201/200).
 * FCM/APNs/native are out of scope. Outbound only.
 */

import { Inject, Injectable, Optional } from '@nestjs/common';
import webpush from 'web-push';
import { validateWebPushEndpointUrl } from '../../../security-platform/web-push-endpoint-guard';
import type { LogContext, Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import { NoOpLogger } from '../../../logging/noop.logger';
import type {
  NotificationChannelPort,
  NotificationChannelSendCommand,
} from '../ports/notification.port';
import { WebPushSubscriptionService } from '../web-push-subscription.service';
import { WebPushVapidCredentialResolver } from './web-push-vapid-credential.resolver';
import {
  classifyWebPushHttpStatus,
  classifyWebPushTransportError,
  isWebPushAbortError,
  redactWebPushSecrets,
  type WebPushNotificationErrorCode,
} from './web-push-notification.errors';

export const WEB_PUSH_SEND = Symbol('WEB_PUSH_SEND');
export const WEB_PUSH_TIMEOUT_MS = 10_000;
export const MAX_WEB_PUSH_PAYLOAD_CHARS = 3500;

export type WebPushNotificationOperationResult =
  Readonly<{ ok: true }> | Readonly<{ ok: false; detail: WebPushNotificationErrorCode }>;

export type WebPushSubscriptionPayload = Readonly<{
  endpoint: string;
  keys: Readonly<{ p256dh: string; auth: string }>;
}>;

export type WebPushSendFn = (
  subscription: WebPushSubscriptionPayload,
  payload: string,
  options: Readonly<{
    TTL: number;
    timeout: number;
    vapidDetails: Readonly<{
      subject: string;
      publicKey: string;
      privateKey: string;
    }>;
  }>,
) => Promise<Readonly<{ statusCode: number }>>;

@Injectable()
export class ProductionWebPushNotificationAdapter implements NotificationChannelPort {
  readonly channelId = 'push' as const;
  readonly active = true;

  private readonly credentials: WebPushVapidCredentialResolver | undefined;
  private readonly subscriptions: WebPushSubscriptionService | undefined;
  private readonly logger: Logger;
  private readonly sendFn: WebPushSendFn;
  private readonly timeoutMs: number;

  constructor(
    @Optional()
    @Inject(WebPushVapidCredentialResolver)
    credentials?: WebPushVapidCredentialResolver,
    @Optional()
    @Inject(WebPushSubscriptionService)
    subscriptions?: WebPushSubscriptionService,
    @Optional() @Inject(LOGGER) logger?: Logger,
    @Optional() @Inject(WEB_PUSH_SEND) sendFn?: WebPushSendFn,
  ) {
    this.credentials = credentials;
    this.subscriptions = subscriptions;
    this.logger = logger?.child(ProductionWebPushNotificationAdapter.name) ?? new NoOpLogger();
    this.sendFn = sendFn ?? defaultWebPushSend;
    this.timeoutMs = WEB_PUSH_TIMEOUT_MS;
  }

  async send(cmd: NotificationChannelSendCommand): Promise<WebPushNotificationOperationResult> {
    const started = Date.now();
    if (!this.credentials || !this.subscriptions) {
      return this.fail('send', 'web_push_invalid_request', started, cmd.workspaceId);
    }

    const subject = cmd.subject.trim();
    const body = cmd.body.trim();
    const payloadText = [subject, body]
      .filter((part) => part.length > 0)
      .join('\n\n')
      .slice(0, MAX_WEB_PUSH_PAYLOAD_CHARS);
    if (!payloadText) {
      return this.fail('send', 'web_push_invalid_request', started, cmd.workspaceId);
    }

    const userId = cmd.chatId.trim();
    if (!userId) {
      return this.fail('send', 'web_push_invalid_request', started, cmd.workspaceId);
    }

    const resolved = await this.credentials.resolve({
      workspaceId: cmd.workspaceId,
      actorUserId: cmd.actorUserId,
      actorRole: cmd.actorRole,
    });
    if (!resolved.ok) {
      return this.fail('send', resolved.detail, started, cmd.workspaceId);
    }

    const active = await this.subscriptions.listActive(cmd.workspaceId, userId);
    if (active.length === 0) {
      return this.fail('send', 'web_push_no_subscription', started, cmd.workspaceId, {
        publicKey: resolved.credential.publicKey,
        privateKey: resolved.credential.privateKey,
        subject: resolved.credential.subject,
      });
    }

    const payload = JSON.stringify({
      title: subject || 'TRP',
      body: body || subject,
    });

    let lastError: WebPushNotificationErrorCode = 'web_push_invalid_response';
    let anyOk = false;

    for (const subscription of active) {
      const guard = validateWebPushEndpointUrl(subscription.endpoint);
      if (!guard.ok) {
        lastError = 'web_push_blocked_endpoint';
        continue;
      }

      const secrets = {
        endpoint: guard.preservedUrl,
        publicKey: resolved.credential.publicKey,
        privateKey: resolved.credential.privateKey,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        subject: resolved.credential.subject,
      };

      try {
        const response = await this.sendFn(
          {
            endpoint: guard.preservedUrl,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          {
            TTL: 60,
            timeout: this.timeoutMs,
            vapidDetails: {
              subject: resolved.credential.subject ?? 'mailto:noreply@localhost',
              publicKey: resolved.credential.publicKey,
              privateKey: resolved.credential.privateKey,
            },
          },
        );
        const statusClass = classifyWebPushHttpStatus(response.statusCode);
        if (statusClass === 'ok') {
          anyOk = true;
          await this.subscriptions.markSuccess(cmd.workspaceId, subscription.id);
          continue;
        }
        lastError = statusClass;
        if (statusClass === 'web_push_gone') {
          await this.subscriptions.markExpired(cmd.workspaceId, subscription.id, statusClass);
        }
      } catch (error) {
        if (isWebPushAbortError(error)) {
          lastError = 'web_push_timeout';
        } else {
          lastError = classifyWebPushTransportError(error);
          if (lastError === 'web_push_gone') {
            await this.subscriptions.markExpired(cmd.workspaceId, subscription.id, lastError);
          }
        }
        this.logger.warn(
          'web_push_notification_failed',
          safeLogContext('send', started, cmd.workspaceId, lastError, secrets),
        );
      }
    }

    if (anyOk) {
      this.logSuccess(started, cmd.workspaceId);
      return Object.freeze({ ok: true as const });
    }
    return this.fail('send', lastError, started, cmd.workspaceId, {
      publicKey: resolved.credential.publicKey,
      privateKey: resolved.credential.privateKey,
      subject: resolved.credential.subject,
    });
  }

  private fail(
    operation: 'send',
    detail: WebPushNotificationErrorCode,
    started: number,
    workspaceId: string | undefined,
    secrets?: Readonly<{
      endpoint?: string;
      publicKey?: string;
      privateKey?: string;
      p256dh?: string;
      auth?: string;
      subject?: string;
    }>,
  ): WebPushNotificationOperationResult {
    this.logger.warn(
      'web_push_notification_failed',
      safeLogContext(operation, started, workspaceId, detail, secrets),
    );
    return Object.freeze({ ok: false as const, detail });
  }

  private logSuccess(started: number, workspaceId: string | undefined): void {
    this.logger.info(
      'web_push_notification_succeeded',
      safeLogContext('send', started, workspaceId, undefined, undefined),
    );
  }
}

async function defaultWebPushSend(
  subscription: WebPushSubscriptionPayload,
  payload: string,
  options: Readonly<{
    TTL: number;
    timeout: number;
    vapidDetails: Readonly<{
      subject: string;
      publicKey: string;
      privateKey: string;
    }>;
  }>,
): Promise<Readonly<{ statusCode: number }>> {
  const result = await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    },
    payload,
    {
      TTL: options.TTL,
      timeout: options.timeout,
      vapidDetails: {
        subject: options.vapidDetails.subject,
        publicKey: options.vapidDetails.publicKey,
        privateKey: options.vapidDetails.privateKey,
      },
    },
  );
  return Object.freeze({ statusCode: result.statusCode });
}

function safeLogContext(
  operation: 'send',
  started: number,
  workspaceId: string | undefined,
  detail: WebPushNotificationErrorCode | undefined,
  secrets:
    | Readonly<{
        endpoint?: string;
        publicKey?: string;
        privateKey?: string;
        p256dh?: string;
        auth?: string;
        subject?: string;
      }>
    | undefined,
): LogContext {
  const context: LogContext = {
    channelId: 'push',
    operation,
    durationMs: Date.now() - started,
  };
  if (workspaceId) context.workspaceId = workspaceId;
  if (detail) context.errorClassification = detail;
  return JSON.parse(redactWebPushSecrets(JSON.stringify(context), secrets ?? {})) as LogContext;
}
