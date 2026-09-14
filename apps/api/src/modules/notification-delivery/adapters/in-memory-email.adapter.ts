/**
 * In-memory Email channel adapter (delivery only).
 *
 * Test double. Does not claim live SMTP. Recipients arrive from EmailConnection
 * via the service — never from deliver() HTTP clients.
 */

import { Injectable } from '@nestjs/common';
import type {
  NotificationChannelPort,
  NotificationChannelSendCommand,
} from '../ports/notification.port';

export type EmailOutboundMessage = Readonly<{
  recipient: string;
  subject: string;
  body: string;
  sentAt: string;
}>;

@Injectable()
export class InMemoryEmailAdapter implements NotificationChannelPort {
  readonly channelId = 'email' as const;
  readonly active = true;

  private readonly sent: EmailOutboundMessage[] = [];
  private failNext: string | null = null;

  failNextSend(detail = 'smtp_server_error'): void {
    this.failNext = detail;
  }

  async send(
    cmd: NotificationChannelSendCommand,
  ): Promise<Readonly<{ ok: true } | { ok: false; detail: string }>> {
    if (this.failNext) {
      const detail = this.failNext;
      this.failNext = null;
      return { ok: false, detail };
    }
    if (!cmd.chatId.trim()) {
      return { ok: false, detail: 'smtp_invalid_request' };
    }
    this.sent.push(
      Object.freeze({
        recipient: cmd.chatId,
        subject: cmd.subject,
        body: cmd.body,
        sentAt: new Date().toISOString(),
      }),
    );
    return { ok: true };
  }

  listSent(): readonly EmailOutboundMessage[] {
    return Object.freeze([...this.sent]);
  }

  clearSent(): void {
    this.sent.length = 0;
  }
}
