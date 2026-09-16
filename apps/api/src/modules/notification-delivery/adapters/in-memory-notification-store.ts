/**
 * RC-24 Epic 6 — Process-local notification store.
 *
 * W3-O01-b: snapshot export/import for preferences / Telegram / DeliveryResult history.
 * W3-O02-b: same owner snapshot extended with Notification Durable Queue work items
 * (TD-045). Distinct from paper Outbox (TD-035). Persistence only — not restart recovery.
 */

import { Injectable } from '@nestjs/common';
import type { DeliveryResult } from '../domain/delivery';
import type { NotificationDeliveryQueueItem } from '../domain/delivery-queue';
import type { DiscordConnection } from '../domain/discord-connection';
import type { EmailConnection } from '../domain/email-connection';
import type { PushConnection } from '../domain/push-connection';
import type { SlackConnection } from '../domain/slack-connection';
import type { TeamsConnection } from '../domain/teams-connection';
import type { TelegramConnection } from '../domain/telegram-connection';
import type { UserNotificationPreferences } from '../domain/user-notification-preferences';

function key(workspaceId: string, userId: string): string {
  return `${workspaceId}::${userId}`;
}

export type NotificationStoreDurableState = Readonly<{
  preferences: UserNotificationPreferences[];
  telegram: TelegramConnection[];
  email: EmailConnection[];
  slack: SlackConnection[];
  discord: DiscordConnection[];
  teams: TeamsConnection[];
  push: PushConnection[];
  deliveries: DeliveryResult[];
  /** W3-O02-b — in-flight / pending / retryable / terminal queue work (not Outbox). */
  queue: NotificationDeliveryQueueItem[];
}>;

@Injectable()
export class InMemoryNotificationStore {
  private readonly preferences = new Map<string, UserNotificationPreferences>();
  private readonly telegram = new Map<string, TelegramConnection>();
  private readonly email = new Map<string, EmailConnection>();
  private readonly slack = new Map<string, SlackConnection>();
  private readonly discord = new Map<string, DiscordConnection>();
  private readonly teams = new Map<string, TeamsConnection>();
  private readonly push = new Map<string, PushConnection>();
  private readonly tokenIndex = new Map<string, string>();
  private readonly deliveries: DeliveryResult[] = [];
  private readonly queue = new Map<string, NotificationDeliveryQueueItem>();

  getPreferences(workspaceId: string, userId: string): UserNotificationPreferences | undefined {
    return this.preferences.get(key(workspaceId, userId));
  }

  savePreferences(prefs: UserNotificationPreferences): void {
    this.preferences.set(key(prefs.workspaceId, prefs.userId), prefs);
  }

  getTelegram(workspaceId: string, userId: string): TelegramConnection | undefined {
    return this.telegram.get(key(workspaceId, userId));
  }

  saveTelegram(connection: TelegramConnection): void {
    const k = key(connection.workspaceId, connection.userId);
    const previous = this.telegram.get(k);
    if (previous?.connectionToken) {
      this.tokenIndex.delete(previous.connectionToken);
    }
    this.telegram.set(k, connection);
    if (connection.connectionToken) {
      this.tokenIndex.set(connection.connectionToken, k);
    }
  }

  findTelegramByToken(connectionToken: string): TelegramConnection | undefined {
    const k = this.tokenIndex.get(connectionToken);
    if (!k) return undefined;
    return this.telegram.get(k);
  }

  getEmail(workspaceId: string, userId: string): EmailConnection | undefined {
    return this.email.get(key(workspaceId, userId));
  }

  saveEmail(connection: EmailConnection): void {
    this.email.set(key(connection.workspaceId, connection.userId), connection);
  }

  getSlack(workspaceId: string, userId: string): SlackConnection | undefined {
    return this.slack.get(key(workspaceId, userId));
  }

  saveSlack(connection: SlackConnection): void {
    this.slack.set(key(connection.workspaceId, connection.userId), connection);
  }

  getDiscord(workspaceId: string, userId: string): DiscordConnection | undefined {
    return this.discord.get(key(workspaceId, userId));
  }

  saveDiscord(connection: DiscordConnection): void {
    this.discord.set(key(connection.workspaceId, connection.userId), connection);
  }

  getTeams(workspaceId: string, userId: string): TeamsConnection | undefined {
    return this.teams.get(key(workspaceId, userId));
  }

  saveTeams(connection: TeamsConnection): void {
    this.teams.set(key(connection.workspaceId, connection.userId), connection);
  }

  getPush(workspaceId: string, userId: string): PushConnection | undefined {
    return this.push.get(key(workspaceId, userId));
  }

  savePush(connection: PushConnection): void {
    this.push.set(key(connection.workspaceId, connection.userId), connection);
  }

  recordDelivery(result: DeliveryResult): void {
    this.deliveries.push(result);
  }

  listDeliveries(): readonly DeliveryResult[] {
    return Object.freeze([...this.deliveries]);
  }

  getQueueItem(queueItemId: string): NotificationDeliveryQueueItem | undefined {
    return this.queue.get(queueItemId);
  }

  saveQueueItem(item: NotificationDeliveryQueueItem): void {
    const workspaceId = item.workspaceId.trim();
    if (!workspaceId) {
      throw new Error('Notification queue item requires workspaceId');
    }
    this.queue.set(item.queueItemId, item);
  }

  listQueueItems(query: {
    workspaceId: string;
    userId?: string;
    openOnly?: boolean;
  }): readonly NotificationDeliveryQueueItem[] {
    const workspaceId = query.workspaceId.trim();
    if (!workspaceId) {
      return Object.freeze([]);
    }
    const userId = query.userId?.trim();
    const openOnly = query.openOnly === true;
    return Object.freeze(
      [...this.queue.values()].filter((item) => {
        if (item.workspaceId !== workspaceId) return false;
        if (userId && item.userId !== userId) return false;
        if (openOnly) {
          return (
            item.status === 'pending' || item.status === 'in-flight' || item.status === 'retryable'
          );
        }
        return true;
      }),
    );
  }

  exportDurableState(): NotificationStoreDurableState {
    return Object.freeze({
      preferences: [...this.preferences.values()],
      telegram: [...this.telegram.values()],
      email: [...this.email.values()],
      slack: [...this.slack.values()],
      discord: [...this.discord.values()],
      teams: [...this.teams.values()],
      push: [...this.push.values()],
      deliveries: [...this.deliveries],
      queue: [...this.queue.values()],
    });
  }

  importDurableState(state: NotificationStoreDurableState): void {
    this.preferences.clear();
    this.telegram.clear();
    this.email.clear();
    this.slack.clear();
    this.discord.clear();
    this.teams.clear();
    this.push.clear();
    this.tokenIndex.clear();
    this.deliveries.length = 0;
    this.queue.clear();
    for (const prefs of state.preferences ?? []) {
      this.preferences.set(key(prefs.workspaceId, prefs.userId), prefs);
    }
    for (const connection of state.telegram ?? []) {
      this.saveTelegram(connection);
    }
    for (const connection of state.email ?? []) {
      this.saveEmail(connection);
    }
    for (const connection of state.slack ?? []) {
      this.saveSlack(connection);
    }
    for (const connection of state.discord ?? []) {
      this.saveDiscord(connection);
    }
    for (const connection of state.teams ?? []) {
      this.saveTeams(connection);
    }
    for (const connection of state.push ?? []) {
      this.savePush(connection);
    }
    for (const delivery of state.deliveries ?? []) {
      this.deliveries.push(delivery);
    }
    for (const item of state.queue ?? []) {
      this.queue.set(item.queueItemId, item);
    }
  }
}
