/**
 * PC-07 — HTTP product views of existing Discord connection and deliveries.
 *
 * Notification Delivery remains delivery owner. Discord remains transport only.
 * Webhook URL is never a product field. Transport is the bound adapter.
 */

import type { DeliveryResult, DeliverySkipReason } from '../notification-delivery/domain/delivery';
import type { DiscordConnection } from '../notification-delivery/domain/discord-connection';
import type { DiscordTransportProjection } from '../notification-delivery/domain/discord-transport-projection';
import type { NotificationChannelDescriptor } from '../notification-delivery/domain/notification-channel';
import {
  deliveryMatchesQuery,
  toDeliveryDetailView,
  type ListNotificationDeliveriesQuery,
  type NotificationDeliveryDetailView,
} from '../notification-product/notification.view';
import { notConnectedTelegram } from '../notification-delivery/domain/telegram-connection';
import { IN_MEMORY_TELEGRAM_TRANSPORT } from '../notification-delivery/domain/telegram-transport-projection';

export type DiscordConnectionProductView = {
  status: DiscordConnection['status'];
  connected: boolean;
  bound: boolean;
  pending: boolean;
  verified: boolean;
  failed: boolean;
  lastErrorCode: string | null;
  connectedAt: string | null;
  boundAt: string | null;
  updatedAt: string;
  bindAvailable: boolean;
  testAvailable: boolean;
  disconnectAvailable: boolean;
  controlPlane: false;
  transport: DiscordTransportProjection['transport'];
  webhookUsed: boolean;
  userEnteredBind: false;
  authorityClass: 'notification-projection';
};

export type DiscordTestProductView = {
  connection: DiscordConnectionProductView;
  delivery: NotificationDeliveryDetailView;
  controlPlane: false;
  webhookUsed: boolean;
  authorityClass: 'notification-projection';
};

export type DiscordDiagnosticsView = {
  connection: DiscordConnectionProductView;
  verification: {
    status: DiscordConnection['status'];
    verified: boolean;
    bound: boolean;
    pending: boolean;
    failed: boolean;
    lastErrorCode: string | null;
  };
  lastDiscordDelivery: {
    deliveryId: string;
    outcome: string;
    skipReason: DeliverySkipReason | null;
    adapterReached: boolean;
    createdAt: string;
  } | null;
  discordTransport: DiscordTransportProjection['transport'];
  webhookUsed: boolean;
  controlPlane: false;
  deferredChannelsActivated: false;
  scheduler: false;
  retries: false;
  authorityClass: 'notification-projection';
};

export type ListDiscordDeliveriesQuery = ListNotificationDeliveriesQuery;

export function toDiscordConnectionView(
  connection: DiscordConnection,
  honesty: DiscordTransportProjection,
): DiscordConnectionProductView {
  const connected = connection.status === 'connected';
  const pending = connection.status === 'pending';
  const bound = pending || connected;
  const failed = pending && Boolean(connection.lastErrorCode);
  return {
    status: connection.status,
    connected,
    bound,
    pending,
    verified: connected,
    failed,
    lastErrorCode: connection.lastErrorCode ?? null,
    connectedAt: connection.connectedAt ?? null,
    boundAt: connection.boundAt ?? null,
    updatedAt: connection.updatedAt,
    bindAvailable: true,
    testAvailable: bound,
    disconnectAvailable: bound,
    controlPlane: false,
    transport: honesty.transport,
    webhookUsed: honesty.webhookUsed,
    userEnteredBind: false,
    authorityClass: 'notification-projection',
  };
}

export function toDiscordTestView(input: {
  connection: DiscordConnection;
  delivery: DeliveryResult;
  channels: readonly NotificationChannelDescriptor[];
  honesty: DiscordTransportProjection;
}): DiscordTestProductView {
  return {
    connection: toDiscordConnectionView(input.connection, input.honesty),
    delivery: toDeliveryDetailView({
      delivery: input.delivery,
      connection: notConnectedTelegram(
        input.connection.workspaceId,
        input.connection.userId,
        input.connection.updatedAt,
      ),
      channels: input.channels,
      honesty: IN_MEMORY_TELEGRAM_TRANSPORT,
    }),
    controlPlane: false,
    webhookUsed: input.honesty.webhookUsed,
    authorityClass: 'notification-projection',
  };
}

export function toDiscordDiagnosticsView(input: {
  connection: DiscordConnection;
  deliveries: readonly DeliveryResult[];
  honesty: DiscordTransportProjection;
}): DiscordDiagnosticsView {
  const connection = toDiscordConnectionView(input.connection, input.honesty);
  const latest = latestDiscordDelivery(input.deliveries);
  const discordAttempt = latest?.attempts.find((attempt) => attempt.channelId === 'discord');
  return {
    connection,
    verification: {
      status: input.connection.status,
      verified: connection.verified,
      bound: connection.bound,
      pending: connection.pending,
      failed: connection.failed,
      lastErrorCode: connection.lastErrorCode,
    },
    lastDiscordDelivery: latest
      ? {
          deliveryId: latest.deliveryId,
          outcome: discordAttempt?.outcome ?? latest.outcome,
          skipReason: discordAttempt?.skipReason ?? null,
          adapterReached:
            discordAttempt?.outcome === 'delivered' || discordAttempt?.outcome === 'failed',
          createdAt: latest.createdAt,
        }
      : null,
    discordTransport: input.honesty.transport,
    webhookUsed: input.honesty.webhookUsed,
    controlPlane: false,
    deferredChannelsActivated: false,
    scheduler: false,
    retries: false,
    authorityClass: 'notification-projection',
  };
}

export function discordDeliveryMatches(
  delivery: DeliveryResult,
  query: ListDiscordDeliveriesQuery,
): boolean {
  if (!delivery.attempts.some((attempt) => attempt.channelId === 'discord')) return false;
  return deliveryMatchesQuery(delivery, query);
}

function latestDiscordDelivery(deliveries: readonly DeliveryResult[]): DeliveryResult | undefined {
  return [...deliveries]
    .filter((item) => item.attempts.some((attempt) => attempt.channelId === 'discord'))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
}
