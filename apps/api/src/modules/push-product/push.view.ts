/**
 * PC-07 — HTTP product views of existing Push connection and deliveries.
 *
 * Notification Delivery remains delivery owner. Push remains transport only.
 * VAPID private key / subscription secrets are never product fields.
 */

import type { DeliveryResult, DeliverySkipReason } from '../notification-delivery/domain/delivery';
import type { PushConnection } from '../notification-delivery/domain/push-connection';
import type { PushTransportProjection } from '../notification-delivery/domain/push-transport-projection';
import type { NotificationChannelDescriptor } from '../notification-delivery/domain/notification-channel';
import type { WebPushSubscriptionPublicView } from '../notification-delivery/domain/web-push-subscription';
import {
  deliveryMatchesQuery,
  toDeliveryDetailView,
  type ListNotificationDeliveriesQuery,
  type NotificationDeliveryDetailView,
} from '../notification-product/notification.view';
import { notConnectedTelegram } from '../notification-delivery/domain/telegram-connection';
import { IN_MEMORY_TELEGRAM_TRANSPORT } from '../notification-delivery/domain/telegram-transport-projection';

export type PushConnectionProductView = {
  status: PushConnection['status'];
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
  transport: PushTransportProjection['transport'];
  pushUsed: boolean;
  adapterReached: boolean;
  userEnteredBind: false;
  authorityClass: 'notification-projection';
};

export type PushTestProductView = {
  connection: PushConnectionProductView;
  delivery: NotificationDeliveryDetailView;
  controlPlane: false;
  pushUsed: boolean;
  authorityClass: 'notification-projection';
};

export type PushDiagnosticsView = {
  connection: PushConnectionProductView;
  verification: {
    status: PushConnection['status'];
    verified: boolean;
    bound: boolean;
    pending: boolean;
    failed: boolean;
    lastErrorCode: string | null;
  };
  lastPushDelivery: {
    deliveryId: string;
    outcome: string;
    skipReason: DeliverySkipReason | null;
    adapterReached: boolean;
    createdAt: string;
  } | null;
  /** Active subscription count only — never endpoints/keys. */
  subscriptionPresent: boolean;
  activeSubscriptionCount: number;
  pushTransport: PushTransportProjection['transport'];
  pushUsed: boolean;
  controlPlane: false;
  deferredChannelsActivated: false;
  scheduler: false;
  retries: false;
  authorityClass: 'notification-projection';
};

export type PushVapidPublicKeyView = {
  publicKey: string;
  controlPlane: false;
  authorityClass: 'notification-projection';
};

export type PushSubscriptionProductView = WebPushSubscriptionPublicView & {
  controlPlane: false;
  authorityClass: 'notification-projection';
};

export type ListPushDeliveriesQuery = ListNotificationDeliveriesQuery;

export function toPushConnectionView(
  connection: PushConnection,
  honesty: PushTransportProjection,
): PushConnectionProductView {
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
    pushUsed: honesty.pushUsed,
    adapterReached: honesty.adapterReached,
    userEnteredBind: false,
    authorityClass: 'notification-projection',
  };
}

export function toPushTestView(input: {
  connection: PushConnection;
  delivery: DeliveryResult;
  channels: readonly NotificationChannelDescriptor[];
  honesty: PushTransportProjection;
}): PushTestProductView {
  return {
    connection: toPushConnectionView(input.connection, input.honesty),
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
    pushUsed: input.honesty.pushUsed,
    authorityClass: 'notification-projection',
  };
}

export function toPushDiagnosticsView(input: {
  connection: PushConnection;
  deliveries: readonly DeliveryResult[];
  honesty: PushTransportProjection;
  activeSubscriptionCount?: number;
}): PushDiagnosticsView {
  const connection = toPushConnectionView(input.connection, input.honesty);
  const latest = latestPushDelivery(input.deliveries);
  const pushAttempt = latest?.attempts.find((attempt) => attempt.channelId === 'push');
  const activeSubscriptionCount = Math.max(0, input.activeSubscriptionCount ?? 0);
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
    lastPushDelivery: latest
      ? {
          deliveryId: latest.deliveryId,
          outcome: pushAttempt?.outcome ?? latest.outcome,
          skipReason: pushAttempt?.skipReason ?? null,
          adapterReached: pushAttempt?.outcome === 'delivered' || pushAttempt?.outcome === 'failed',
          createdAt: latest.createdAt,
        }
      : null,
    subscriptionPresent: activeSubscriptionCount > 0,
    activeSubscriptionCount,
    pushTransport: input.honesty.transport,
    pushUsed: input.honesty.pushUsed,
    controlPlane: false,
    deferredChannelsActivated: false,
    scheduler: false,
    retries: false,
    authorityClass: 'notification-projection',
  };
}

export function toPushSubscriptionView(
  subscription: WebPushSubscriptionPublicView,
): PushSubscriptionProductView {
  return {
    ...subscription,
    controlPlane: false,
    authorityClass: 'notification-projection',
  };
}

export function pushDeliveryMatches(
  delivery: DeliveryResult,
  query: ListPushDeliveriesQuery,
): boolean {
  if (!delivery.attempts.some((attempt) => attempt.channelId === 'push')) return false;
  return deliveryMatchesQuery(delivery, query);
}

function latestPushDelivery(deliveries: readonly DeliveryResult[]): DeliveryResult | undefined {
  return [...deliveries]
    .filter((item) => item.attempts.some((attempt) => attempt.channelId === 'push'))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
}
