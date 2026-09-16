/**
 * In-memory Push channel adapter (delivery only).
 *
 * Test double. Does not claim live Web Push. Does not store VAPID or endpoints.
 */

import { Injectable } from '@nestjs/common';
import type {
  NotificationChannelPort,
  NotificationChannelSendCommand,
} from '../ports/notification.port';

export type PushOutboundMessage = Readonly<{
  subject: string;
  body: string;
  userId: string;
  sentAt: string;
}>;

@Injectable()
export class InMemoryPushAdapter implements NotificationChannelPort {
  readonly channelId = 'push' as const;
  readonly active = true;

  private readonly sent: PushOutboundMessage[] = [];
  private failNext: string | null = null;

  failNextSend(detail = 'web_push_server_error'): void {
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
    const subject = cmd.subject.trim();
    const body = cmd.body.trim();
    if (!subject && !body) {
      return { ok: false, detail: 'web_push_invalid_request' };
    }
    this.sent.push(
      Object.freeze({
        subject,
        body,
        userId: cmd.chatId,
        sentAt: new Date().toISOString(),
      }),
    );
    return { ok: true };
  }

  listSent(): readonly PushOutboundMessage[] {
    return Object.freeze([...this.sent]);
  }

  clearSent(): void {
    this.sent.length = 0;
  }
}
