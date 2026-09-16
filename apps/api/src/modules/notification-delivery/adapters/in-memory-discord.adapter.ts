/**
 * In-memory Discord channel adapter (delivery only).
 *
 * Test double. Does not claim live Discord webhook. Does not store webhook URLs.
 */

import { Injectable } from '@nestjs/common';
import type {
  NotificationChannelPort,
  NotificationChannelSendCommand,
} from '../ports/notification.port';

export type DiscordOutboundMessage = Readonly<{
  subject: string;
  body: string;
  sentAt: string;
}>;

@Injectable()
export class InMemoryDiscordAdapter implements NotificationChannelPort {
  readonly channelId = 'discord' as const;
  readonly active = true;

  private readonly sent: DiscordOutboundMessage[] = [];
  private failNext: string | null = null;

  failNextSend(detail = 'discord_webhook_server_error'): void {
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
      return { ok: false, detail: 'discord_webhook_invalid_request' };
    }
    this.sent.push(
      Object.freeze({
        subject,
        body,
        sentAt: new Date().toISOString(),
      }),
    );
    return { ok: true };
  }

  listSent(): readonly DiscordOutboundMessage[] {
    return Object.freeze([...this.sent]);
  }

  clearSent(): void {
    this.sent.length = 0;
  }
}
