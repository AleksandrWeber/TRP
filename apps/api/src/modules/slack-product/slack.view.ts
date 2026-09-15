/**
 * PC-07 — HTTP product views of existing Slack connection and deliveries.
 *
 * Notification Delivery remains delivery owner. Slack remains transport only.
 * Webhook URL is never a product field. Transport is the bound adapter.
 */

import type { DeliveryResult, DeliverySkipReason } from '../notification-delivery/domain/delivery';
import type { SlackConnection } from '../notification-delivery/domain/slack-connection';
import type { SlackTransportProjection } from '../notification-delivery/domain/slack-transport-projection';
import type { NotificationChannelDescriptor } from '../notification-delivery/domain/notification-channel';
import {
  deliveryMatchesQuery,
  toDeliveryDetailView,
  type ListNotificationDeliveriesQuery,
  type NotificationDeliveryDetailView,
} from '../notification-product/notification.view';
import { notConnectedTelegram } from '../notification-delivery/domain/telegram-connection';
import { IN_MEMORY_TELEGRAM_TRANSPORT } from '../notification-delivery/domain/telegram-transport-projection';

export type SlackConnectionProductView = {
  status: SlackConnection['status'];
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
  transport: SlackTransportProjection['transport'];
  webhookUsed: boolean;
  userEnteredBind: false;
  authorityClass: 'notification-projection';
};

export type SlackTestProductView = {
  connection: SlackConnectionProductView;
  delivery: NotificationDeliveryDetailView;
  controlPlane: false;
  webhookUsed: boolean;
  authorityClass: 'notification-projection';
};

export type SlackDiagnosticsView = {
  connection: SlackConnectionProductView;
  verification: {
    status: SlackConnection['status'];
    verified: boolean;
    bound: boolean;
    pending: boolean;
    failed: boolean;
    lastErrorCode: string | null;
  };
  lastSlackDelivery: {
    deliveryId: string;
    outcome: string;
    skipReason: DeliverySkipReason | null;
    adapterReached: boolean;
    createdAt: string;
  } | null;
  slackTransport: SlackTransportProjection['transport'];
  webhookUsed: boolean;
  controlPlane: false;
  deferredChannelsActivated: false;
  scheduler: false;
  retries: false;
  authorityClass: 'notification-projection';
};

export type ListSlackDeliveriesQuery = ListNotificationDeliveriesQuery;

export function toSlackConnectionView(
  connection: SlackConnection,
  honesty: SlackTransportProjection,
): SlackConnectionProductView {
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

export function toSlackTestView(input: {
  connection: SlackConnection;
  delivery: DeliveryResult;
  channels: readonly NotificationChannelDescriptor[];
  honesty: SlackTransportProjection;
}): SlackTestProductView {
  return {
    connection: toSlackConnectionView(input.connection, input.honesty),
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

export function toSlackDiagnosticsView(input: {
  connection: SlackConnection;
  deliveries: readonly DeliveryResult[];
  honesty: SlackTransportProjection;
}): SlackDiagnosticsView {
  const connection = toSlackConnectionView(input.connection, input.honesty);
  const latest = latestSlackDelivery(input.deliveries);
  const slackAttempt = latest?.attempts.find((attempt) => attempt.channelId === 'slack');
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
    lastSlackDelivery: latest
      ? {
          deliveryId: latest.deliveryId,
          outcome: slackAttempt?.outcome ?? latest.outcome,
          skipReason: slackAttempt?.skipReason ?? null,
          adapterReached:
            slackAttempt?.outcome === 'delivered' || slackAttempt?.outcome === 'failed',
          createdAt: latest.createdAt,
        }
      : null,
    slackTransport: input.honesty.transport,
    webhookUsed: input.honesty.webhookUsed,
    controlPlane: false,
    deferredChannelsActivated: false,
    scheduler: false,
    retries: false,
    authorityClass: 'notification-projection',
  };
}

export function slackDeliveryMatches(
  delivery: DeliveryResult,
  query: ListSlackDeliveriesQuery,
): boolean {
  if (!delivery.attempts.some((attempt) => attempt.channelId === 'slack')) return false;
  return deliveryMatchesQuery(delivery, query);
}

function latestSlackDelivery(deliveries: readonly DeliveryResult[]): DeliveryResult | undefined {
  return [...deliveries]
    .filter((item) => item.attempts.some((attempt) => attempt.channelId === 'slack'))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
}
