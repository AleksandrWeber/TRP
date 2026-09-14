/**
 * Production SMTP notification adapter.
 *
 * Delivery only. Credentials are retrieved at send time and never stored
 * on the adapter. Connected is defined by successful sendMail, not verify().
 * Does not import Auth host-mail.
 */

import { Inject, Injectable, Optional } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { validateSmtpOutboundHost } from '../../../security-platform/smtp-host-guard';
import type { LogContext, Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import { NoOpLogger } from '../../../logging/noop.logger';
import { parseEmailRecipient } from '../domain/email-connection';
import type {
  NotificationChannelPort,
  NotificationChannelSendCommand,
} from '../ports/notification.port';
import { SmtpCredentialResolver } from './smtp-credential.resolver';
import {
  classifySmtpTransportError,
  redactSmtpSecrets,
  type SmtpNotificationErrorCode,
} from './smtp-notification.errors';

export const SMTP_TRANSPORT_FACTORY = Symbol('SMTP_TRANSPORT_FACTORY');
export const SMTP_SEND_TIMEOUT_MS = 10_000;

export type SmtpNotificationOperationResult =
  Readonly<{ ok: true }> | Readonly<{ ok: false; detail: SmtpNotificationErrorCode }>;

export type SmtpTransportOptions = Readonly<{
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
  auth: Readonly<{ user: string; pass: string }>;
  tls: Readonly<{ rejectUnauthorized: true }>;
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
}>;

export type SmtpMailMessage = Readonly<{
  from: string;
  to: string;
  subject: string;
  text: string;
}>;

export type SmtpMailTransport = {
  sendMail(message: SmtpMailMessage): Promise<unknown>;
  close?: () => void;
};

export type SmtpTransportFactory = (options: SmtpTransportOptions) => SmtpMailTransport;

@Injectable()
export class ProductionSmtpNotificationAdapter implements NotificationChannelPort {
  readonly channelId = 'email' as const;
  readonly active = true;

  private readonly credentials: SmtpCredentialResolver | undefined;
  private readonly logger: Logger;
  private readonly factory: SmtpTransportFactory;

  constructor(
    @Optional() @Inject(SmtpCredentialResolver) credentials?: SmtpCredentialResolver,
    @Optional() @Inject(LOGGER) logger?: Logger,
    @Optional() @Inject(SMTP_TRANSPORT_FACTORY) factory?: SmtpTransportFactory,
  ) {
    this.credentials = credentials;
    this.logger = logger?.child(ProductionSmtpNotificationAdapter.name) ?? new NoOpLogger();
    this.factory = factory ?? defaultSmtpTransportFactory;
  }

  async send(cmd: NotificationChannelSendCommand): Promise<SmtpNotificationOperationResult> {
    const started = Date.now();
    const destination = parseEmailRecipient(cmd.chatId);
    if (!destination.ok) {
      return this.fail('sendMail', 'smtp_invalid_request', started, cmd.workspaceId);
    }
    if (!this.credentials) {
      return this.fail('sendMail', 'smtp_invalid_request', started, cmd.workspaceId);
    }

    const resolved = await this.credentials.resolve({
      workspaceId: cmd.workspaceId,
      actorUserId: cmd.actorUserId,
      actorRole: cmd.actorRole,
    });
    if (!resolved.ok) {
      return this.fail('sendMail', resolved.detail, started, cmd.workspaceId);
    }

    const hostGuard = validateSmtpOutboundHost(resolved.credential.host);
    if (!hostGuard.ok) {
      return this.fail(
        'sendMail',
        'smtp_blocked_host',
        started,
        cmd.workspaceId,
        resolved.credential,
      );
    }

    const tls = smtpTlsPolicy(resolved.credential.port);
    if (!tls.ok) {
      return this.fail('sendMail', tls.detail, started, cmd.workspaceId, resolved.credential);
    }

    const subject = cmd.subject.trim();
    const body = cmd.body.trim();
    if (!subject && !body) {
      return this.fail(
        'sendMail',
        'smtp_invalid_request',
        started,
        cmd.workspaceId,
        resolved.credential,
      );
    }

    const transport = this.factory({
      host: resolved.credential.host,
      port: tls.port,
      secure: tls.secure,
      requireTLS: tls.requireTLS,
      auth: { user: resolved.credential.username, pass: resolved.credential.password },
      tls: { rejectUnauthorized: true },
      connectionTimeout: SMTP_SEND_TIMEOUT_MS,
      greetingTimeout: SMTP_SEND_TIMEOUT_MS,
      socketTimeout: SMTP_SEND_TIMEOUT_MS,
    });

    try {
      await transport.sendMail({
        from: resolved.credential.sender,
        to: destination.recipient,
        subject: subject || 'Notification',
        text: [subject, body].filter((part) => part.length > 0).join('\n\n'),
      });
      this.logSuccess(started, cmd.workspaceId);
      return Object.freeze({ ok: true as const });
    } catch (error) {
      return this.fail(
        'sendMail',
        classifySmtpTransportError(error),
        started,
        cmd.workspaceId,
        resolved.credential,
      );
    } finally {
      try {
        transport.close?.();
      } catch {
        // Transport close is best-effort; send outcome already classified.
      }
    }
  }

  private fail(
    operation: 'sendMail',
    detail: SmtpNotificationErrorCode,
    started: number,
    workspaceId: string | undefined,
    secrets?: Readonly<{ password?: string; username?: string; sender?: string }>,
  ): SmtpNotificationOperationResult {
    this.logger.warn(
      'smtp_notification_failed',
      safeLogContext(operation, started, workspaceId, detail, secrets),
    );
    return Object.freeze({ ok: false as const, detail });
  }

  private logSuccess(started: number, workspaceId: string | undefined): void {
    this.logger.info(
      'smtp_notification_succeeded',
      safeLogContext('sendMail', started, workspaceId, undefined, undefined),
    );
  }
}

export function smtpTlsPolicy(
  portValue: string,
):
  | Readonly<{ ok: true; port: number; secure: boolean; requireTLS: boolean }>
  | Readonly<{ ok: false; detail: SmtpNotificationErrorCode }> {
  if (!/^[0-9]{1,5}$/.test(portValue.trim())) {
    return Object.freeze({ ok: false as const, detail: 'smtp_invalid_request' as const });
  }
  const port = Number(portValue);
  if (port === 465) {
    return Object.freeze({ ok: true as const, port, secure: true, requireTLS: false });
  }
  if (port === 587) {
    return Object.freeze({ ok: true as const, port, secure: false, requireTLS: true });
  }
  return Object.freeze({ ok: false as const, detail: 'smtp_tls_required' as const });
}

function defaultSmtpTransportFactory(options: SmtpTransportOptions): SmtpMailTransport {
  return createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    requireTLS: options.requireTLS,
    auth: { user: options.auth.user, pass: options.auth.pass },
    tls: { rejectUnauthorized: options.tls.rejectUnauthorized },
    connectionTimeout: options.connectionTimeout,
    greetingTimeout: options.greetingTimeout,
    socketTimeout: options.socketTimeout,
  });
}

function safeLogContext(
  operation: 'sendMail',
  started: number,
  workspaceId: string | undefined,
  detail: SmtpNotificationErrorCode | undefined,
  secrets: Readonly<{ password?: string; username?: string; sender?: string }> | undefined,
): LogContext {
  const context: LogContext = {
    channelId: 'email',
    operation,
    durationMs: Date.now() - started,
  };
  if (workspaceId) context.workspaceId = workspaceId;
  if (detail) context.errorClassification = detail;
  return JSON.parse(redactSmtpSecrets(JSON.stringify(context), secrets ?? {})) as LogContext;
}
