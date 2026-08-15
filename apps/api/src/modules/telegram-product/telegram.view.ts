/**
 * PC-07 — HTTP product views of existing Telegram connection and deliveries.
 *
 * Notification Delivery remains delivery owner. Telegram remains transport only.
 * Chat id is never a product field. Connection tokens are never a product field.
 * Not a Bot API. Not a control plane. Not a new SoT.
 */

import type { DeliveryResult, DeliverySkipReason } from '../notification-delivery/domain/delivery';
import type { NotificationChannelDescriptor } from '../notification-delivery/domain/notification-channel';
import type { TelegramConnection } from '../notification-delivery/domain/telegram-connection';
import {
  deliveryMatchesQuery,
  toDeliveryDetailView,
  toDeliveryPageView,
  type ListNotificationDeliveriesQuery,
  type NotificationDeliveryDetailView,
  type NotificationDeliveryPageView,
} from '../notification-product/notification.view';

export type TelegramConnectionProductView = {
  status: TelegramConnection['status'];
  connected: boolean;
  chatBound: boolean;
  pending: boolean;
  verified: boolean;
  connectedAt: string | null;
  updatedAt: string;
  deepLink: string | null;
  connectAvailable: boolean;
  completeAvailable: boolean;
  verifyAvailable: boolean;
  testAvailable: boolean;
  disconnectAvailable: boolean;
  controlPlane: false;
  transport: 'in-memory';
  botApiUsed: false;
  userEnteredBind: false;
  authorityClass: 'notification-projection';
};

export type TelegramConnectProductView = {
  connection: TelegramConnectionProductView;
  deepLink: string;
  controlPlane: false;
  botApiUsed: false;
  userEnteredBind: false;
  authorityClass: 'notification-projection';
};

export type TelegramTestProductView = {
  connection: TelegramConnectionProductView;
  delivery: NotificationDeliveryDetailView;
  controlPlane: false;
  botApiUsed: false;
  authorityClass: 'notification-projection';
};

export type TelegramDiagnosticsView = {
  connection: TelegramConnectionProductView;
  verification: {
    status: TelegramConnection['status'];
    verified: boolean;
    chatBound: boolean;
    pending: boolean;
  };
  lastTelegramDelivery: {
    deliveryId: string;
    outcome: string;
    skipReason: DeliverySkipReason | null;
    adapterReached: boolean;
    createdAt: string;
  } | null;
  telegramTransport: 'in-memory';
  botApiUsed: false;
  controlPlane: false;
  deferredChannelsActivated: false;
  scheduler: false;
  retries: false;
  authorityClass: 'notification-projection';
};

export type TelegramDeliveryPageView = NotificationDeliveryPageView;
export type TelegramDeliveryDetailView = NotificationDeliveryDetailView;
export type ListTelegramDeliveriesQuery = ListNotificationDeliveriesQuery;

export function telegramDeepLink(connectionToken: string): string {
  return `tg://connect/${connectionToken}`;
}

export function toTelegramConnectionView(
  connection: TelegramConnection,
): TelegramConnectionProductView {
  const connected = connection.status === 'connected' && Boolean(connection.chatId);
  const pending = connection.status === 'pending';
  return {
    status: connection.status,
    connected,
    chatBound: Boolean(connection.chatId),
    pending,
    verified: connected,
    connectedAt: connection.connectedAt ?? null,
    updatedAt: connection.updatedAt,
    deepLink:
      pending && connection.connectionToken ? telegramDeepLink(connection.connectionToken) : null,
    connectAvailable: connection.status === 'not-connected',
    completeAvailable: pending,
    verifyAvailable: pending || connected,
    testAvailable: connected,
    disconnectAvailable: pending || connected,
    controlPlane: false,
    transport: 'in-memory',
    botApiUsed: false,
    userEnteredBind: false,
    authorityClass: 'notification-projection',
  };
}

export function toTelegramConnectView(input: {
  connection: TelegramConnection;
  deepLink: string;
}): TelegramConnectProductView {
  return {
    connection: toTelegramConnectionView(input.connection),
    deepLink: input.deepLink,
    controlPlane: false,
    botApiUsed: false,
    userEnteredBind: false,
    authorityClass: 'notification-projection',
  };
}

export function toTelegramTestView(input: {
  connection: TelegramConnection;
  delivery: DeliveryResult;
  channels: readonly NotificationChannelDescriptor[];
}): TelegramTestProductView {
  return {
    connection: toTelegramConnectionView(input.connection),
    delivery: toDeliveryDetailView({
      delivery: input.delivery,
      connection: input.connection,
      channels: input.channels,
    }),
    controlPlane: false,
    botApiUsed: false,
    authorityClass: 'notification-projection',
  };
}

export function toTelegramDiagnosticsView(input: {
  connection: TelegramConnection;
  deliveries: readonly DeliveryResult[];
}): TelegramDiagnosticsView {
  const connection = toTelegramConnectionView(input.connection);
  const latest = latestTelegramDelivery(input.deliveries);
  const telegramAttempt = latest?.attempts.find((attempt) => attempt.channelId === 'telegram');
  return {
    connection,
    verification: {
      status: input.connection.status,
      verified: connection.verified,
      chatBound: connection.chatBound,
      pending: connection.pending,
    },
    lastTelegramDelivery: latest
      ? {
          deliveryId: latest.deliveryId,
          outcome: telegramAttempt?.outcome ?? latest.outcome,
          skipReason: telegramAttempt?.skipReason ?? null,
          adapterReached:
            telegramAttempt?.outcome === 'delivered' || telegramAttempt?.outcome === 'failed',
          createdAt: latest.createdAt,
        }
      : null,
    telegramTransport: 'in-memory',
    botApiUsed: false,
    controlPlane: false,
    deferredChannelsActivated: false,
    scheduler: false,
    retries: false,
    authorityClass: 'notification-projection',
  };
}

export function telegramDeliveryMatches(
  delivery: DeliveryResult,
  query: ListTelegramDeliveriesQuery,
): boolean {
  if (!delivery.attempts.some((attempt) => attempt.channelId === 'telegram')) return false;
  return deliveryMatchesQuery(delivery, query);
}

export function toTelegramDeliveryPageView(
  items: readonly DeliveryResult[],
): TelegramDeliveryPageView {
  return toDeliveryPageView(items);
}

export function toTelegramDeliveryDetailView(input: {
  delivery: DeliveryResult;
  connection: TelegramConnection;
  channels: readonly NotificationChannelDescriptor[];
}): TelegramDeliveryDetailView {
  return toDeliveryDetailView(input);
}

function latestTelegramDelivery(deliveries: readonly DeliveryResult[]): DeliveryResult | undefined {
  return [...deliveries]
    .filter((item) => item.attempts.some((attempt) => attempt.channelId === 'telegram'))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
}
