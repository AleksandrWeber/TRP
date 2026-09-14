/**
 * Read-only classifier of the bound EMAIL_CHANNEL_ADAPTER.
 *
 * Projection only. Does not send or retrieve Vault secrets.
 */

import { InMemoryEmailAdapter } from '../adapters/in-memory-email.adapter';
import { ProductionSmtpNotificationAdapter } from '../adapters/production-smtp-notification.adapter';
import type { NotificationChannelPort } from '../ports/notification.port';

export type EmailTransportKind = 'in-memory' | 'smtp';

export type EmailTransportProjection = Readonly<{
  transport: EmailTransportKind;
  smtpUsed: boolean;
}>;

export const IN_MEMORY_EMAIL_TRANSPORT: EmailTransportProjection = Object.freeze({
  transport: 'in-memory',
  smtpUsed: false,
});

export const SMTP_EMAIL_TRANSPORT: EmailTransportProjection = Object.freeze({
  transport: 'smtp',
  smtpUsed: true,
});

export function projectEmailTransport(adapter: NotificationChannelPort): EmailTransportProjection {
  if (adapter instanceof ProductionSmtpNotificationAdapter) {
    return SMTP_EMAIL_TRANSPORT;
  }
  if (adapter instanceof InMemoryEmailAdapter) {
    return IN_MEMORY_EMAIL_TRANSPORT;
  }
  return IN_MEMORY_EMAIL_TRANSPORT;
}
