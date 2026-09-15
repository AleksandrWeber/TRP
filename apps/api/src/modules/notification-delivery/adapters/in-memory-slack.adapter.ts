/**
 * In-memory Slack channel adapter (delivery only).
 *
 * Test double. Does not claim live Slack webhook. Does not store webhook URLs.
 */

import { Injectable } from '@nestjs/common';
import type {
  NotificationChannelPort,
  NotificationChannelSendCommand,
} from '../ports/notification.port';

export type SlackOutboundMessage = Readonly<{
  subject: string;
  body: string;
  sentAt: string;
}>;

@Injectable()
export class InMemorySlackAdapter implements NotificationChannelPort {
  readonly channelId = 'slack' as const;
  readonly active = true;

  private readonly sent: SlackOutboundMessage[] = [];
  private failNext: string | null = null;

  failNextSend(detail = 'slack_webhook_server_error'): void {
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
      return { ok: false, detail: 'slack_webhook_invalid_request' };
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

  listSent(): readonly SlackOutboundMessage[] {
    return Object.freeze([...this.sent]);
  }

  clearSent(): void {
    this.sent.length = 0;
  }
}
