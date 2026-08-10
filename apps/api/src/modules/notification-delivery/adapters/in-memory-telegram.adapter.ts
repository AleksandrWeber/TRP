/**
 * RC-24 Epic 6 — In-memory Telegram channel adapter (delivery only).
 *
 * No trading commands. No pause/resume/stop. Chat ids arrive from the
 * platform bind callback — never from a user-entered form field.
 */

import { Injectable } from '@nestjs/common';
import type { NotificationChannelPort } from '../ports/notification.port';

export type TelegramOutboundMessage = Readonly<{
  chatId: string;
  subject: string;
  body: string;
  sentAt: string;
}>;

@Injectable()
export class InMemoryTelegramAdapter implements NotificationChannelPort {
  readonly channelId = 'telegram' as const;
  readonly active = true;

  private readonly sent: TelegramOutboundMessage[] = [];

  send(
    cmd: Readonly<{
      chatId: string;
      subject: string;
      body: string;
    }>,
  ): Readonly<{ ok: true } | { ok: false; detail: string }> {
    if (!cmd.chatId.trim()) {
      return { ok: false, detail: 'chatId missing' };
    }
    this.sent.push(
      Object.freeze({
        chatId: cmd.chatId,
        subject: cmd.subject,
        body: cmd.body,
        sentAt: new Date().toISOString(),
      }),
    );
    return { ok: true };
  }

  listSent(): readonly TelegramOutboundMessage[] {
    return Object.freeze([...this.sent]);
  }

  clearSent(): void {
    this.sent.length = 0;
  }
}
