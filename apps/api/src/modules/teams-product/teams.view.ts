/**
 * PC-07 — HTTP product views of existing Teams connection and deliveries.
 *
 * Notification Delivery remains delivery owner. Teams remains transport only.
 * Webhook URL is never a product field. Transport is the bound adapter.
 */

import type { DeliveryResult, DeliverySkipReason } from '../notification-delivery/domain/delivery';
import type { TeamsConnection } from '../notification-delivery/domain/teams-connection';
import type { TeamsTransportProjection } from '../notification-delivery/domain/teams-transport-projection';
import type { NotificationChannelDescriptor } from '../notification-delivery/domain/notification-channel';
import {
  deliveryMatchesQuery,
  toDeliveryDetailView,
  type ListNotificationDeliveriesQuery,
  type NotificationDeliveryDetailView,
} from '../notification-product/notification.view';
import { notConnectedTelegram } from '../notification-delivery/domain/telegram-connection';
import { IN_MEMORY_TELEGRAM_TRANSPORT } from '../notification-delivery/domain/telegram-transport-projection';

export type TeamsConnectionProductView = {
  status: TeamsConnection['status'];
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
  transport: TeamsTransportProjection['transport'];
  webhookUsed: boolean;
  userEnteredBind: false;
  authorityClass: 'notification-projection';
};

export type TeamsTestProductView = {
  connection: TeamsConnectionProductView;
  delivery: NotificationDeliveryDetailView;
  controlPlane: false;
  webhookUsed: boolean;
  authorityClass: 'notification-projection';
};

export type TeamsDiagnosticsView = {
  connection: TeamsConnectionProductView;
  verification: {
    status: TeamsConnection['status'];
    verified: boolean;
    bound: boolean;
    pending: boolean;
    failed: boolean;
    lastErrorCode: string | null;
  };
  lastTeamsDelivery: {
    deliveryId: string;
    outcome: string;
    skipReason: DeliverySkipReason | null;
    adapterReached: boolean;
    createdAt: string;
  } | null;
  teamsTransport: TeamsTransportProjection['transport'];
  webhookUsed: boolean;
  controlPlane: false;
  deferredChannelsActivated: false;
  scheduler: false;
  retries: false;
  authorityClass: 'notification-projection';
};

export type ListTeamsDeliveriesQuery = ListNotificationDeliveriesQuery;

export function toTeamsConnectionView(
  connection: TeamsConnection,
  honesty: TeamsTransportProjection,
): TeamsConnectionProductView {
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

export function toTeamsTestView(input: {
  connection: TeamsConnection;
  delivery: DeliveryResult;
  channels: readonly NotificationChannelDescriptor[];
  honesty: TeamsTransportProjection;
}): TeamsTestProductView {
  return {
    connection: toTeamsConnectionView(input.connection, input.honesty),
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

export function toTeamsDiagnosticsView(input: {
  connection: TeamsConnection;
  deliveries: readonly DeliveryResult[];
  honesty: TeamsTransportProjection;
}): TeamsDiagnosticsView {
  const connection = toTeamsConnectionView(input.connection, input.honesty);
  const latest = latestTeamsDelivery(input.deliveries);
  const teamsAttempt = latest?.attempts.find((attempt) => attempt.channelId === 'teams');
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
    lastTeamsDelivery: latest
      ? {
          deliveryId: latest.deliveryId,
          outcome: teamsAttempt?.outcome ?? latest.outcome,
          skipReason: teamsAttempt?.skipReason ?? null,
          adapterReached:
            teamsAttempt?.outcome === 'delivered' || teamsAttempt?.outcome === 'failed',
          createdAt: latest.createdAt,
        }
      : null,
    teamsTransport: input.honesty.transport,
    webhookUsed: input.honesty.webhookUsed,
    controlPlane: false,
    deferredChannelsActivated: false,
    scheduler: false,
    retries: false,
    authorityClass: 'notification-projection',
  };
}

export function teamsDeliveryMatches(
  delivery: DeliveryResult,
  query: ListTeamsDeliveriesQuery,
): boolean {
  if (!delivery.attempts.some((attempt) => attempt.channelId === 'teams')) return false;
  return deliveryMatchesQuery(delivery, query);
}

function latestTeamsDelivery(deliveries: readonly DeliveryResult[]): DeliveryResult | undefined {
  return [...deliveries]
    .filter((item) => item.attempts.some((attempt) => attempt.channelId === 'teams'))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
}
