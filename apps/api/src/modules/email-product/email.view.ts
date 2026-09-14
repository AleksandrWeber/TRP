/**
 * PC-07 — HTTP product views of existing Email connection and deliveries.
 *
 * Notification Delivery remains delivery owner. Email remains transport only.
 * SMTP password is never a product field. Recipient may appear for operator confirmation.
 * Transport is the bound adapter. Not a control plane. Not a new SoT.
 */

import type { DeliveryResult, DeliverySkipReason } from '../notification-delivery/domain/delivery';
import type { EmailConnection } from '../notification-delivery/domain/email-connection';
import type { EmailTransportProjection } from '../notification-delivery/domain/email-transport-projection';
import type { NotificationChannelDescriptor } from '../notification-delivery/domain/notification-channel';
import {
  deliveryMatchesQuery,
  toDeliveryDetailView,
  toDeliveryPageView,
  type ListNotificationDeliveriesQuery,
  type NotificationDeliveryDetailView,
  type NotificationDeliveryPageView,
} from '../notification-product/notification.view';
import { notConnectedTelegram } from '../notification-delivery/domain/telegram-connection';
import { IN_MEMORY_TELEGRAM_TRANSPORT } from '../notification-delivery/domain/telegram-transport-projection';

export type EmailConnectionProductView = {
  status: EmailConnection['status'];
  connected: boolean;
  recipientBound: boolean;
  recipient: string | null;
  pending: boolean;
  verified: boolean;
  connectedAt: string | null;
  updatedAt: string;
  bindAvailable: boolean;
  testAvailable: boolean;
  disconnectAvailable: boolean;
  controlPlane: false;
  transport: EmailTransportProjection['transport'];
  smtpUsed: boolean;
  userEnteredBind: true;
  authorityClass: 'notification-projection';
};

export type EmailTestProductView = {
  connection: EmailConnectionProductView;
  delivery: NotificationDeliveryDetailView;
  controlPlane: false;
  smtpUsed: boolean;
  authorityClass: 'notification-projection';
};

export type EmailDiagnosticsView = {
  connection: EmailConnectionProductView;
  verification: {
    status: EmailConnection['status'];
    verified: boolean;
    recipientBound: boolean;
    pending: boolean;
  };
  lastEmailDelivery: {
    deliveryId: string;
    outcome: string;
    skipReason: DeliverySkipReason | null;
    adapterReached: boolean;
    createdAt: string;
  } | null;
  emailTransport: EmailTransportProjection['transport'];
  smtpUsed: boolean;
  controlPlane: false;
  deferredChannelsActivated: false;
  scheduler: false;
  retries: false;
  authorityClass: 'notification-projection';
};

export type EmailDeliveryPageView = NotificationDeliveryPageView;
export type EmailDeliveryDetailView = NotificationDeliveryDetailView;
export type ListEmailDeliveriesQuery = ListNotificationDeliveriesQuery;

export function toEmailConnectionView(
  connection: EmailConnection,
  honesty: EmailTransportProjection,
): EmailConnectionProductView {
  const connected = connection.status === 'connected' && Boolean(connection.recipient);
  const pending = connection.status === 'pending';
  const recipientBound = Boolean(connection.recipient);
  return {
    status: connection.status,
    connected,
    recipientBound,
    recipient: connection.recipient ?? null,
    pending,
    verified: connected,
    connectedAt: connection.connectedAt ?? null,
    updatedAt: connection.updatedAt,
    bindAvailable: true,
    testAvailable: recipientBound,
    disconnectAvailable: pending || connected,
    controlPlane: false,
    transport: honesty.transport,
    smtpUsed: honesty.smtpUsed,
    userEnteredBind: true,
    authorityClass: 'notification-projection',
  };
}

export function toEmailTestView(input: {
  connection: EmailConnection;
  delivery: DeliveryResult;
  channels: readonly NotificationChannelDescriptor[];
  honesty: EmailTransportProjection;
}): EmailTestProductView {
  return {
    connection: toEmailConnectionView(input.connection, input.honesty),
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
    smtpUsed: input.honesty.smtpUsed,
    authorityClass: 'notification-projection',
  };
}

export function toEmailDiagnosticsView(input: {
  connection: EmailConnection;
  deliveries: readonly DeliveryResult[];
  honesty: EmailTransportProjection;
}): EmailDiagnosticsView {
  const connection = toEmailConnectionView(input.connection, input.honesty);
  const latest = latestEmailDelivery(input.deliveries);
  const emailAttempt = latest?.attempts.find((attempt) => attempt.channelId === 'email');
  return {
    connection,
    verification: {
      status: input.connection.status,
      verified: connection.verified,
      recipientBound: connection.recipientBound,
      pending: connection.pending,
    },
    lastEmailDelivery: latest
      ? {
          deliveryId: latest.deliveryId,
          outcome: emailAttempt?.outcome ?? latest.outcome,
          skipReason: emailAttempt?.skipReason ?? null,
          adapterReached:
            emailAttempt?.outcome === 'delivered' || emailAttempt?.outcome === 'failed',
          createdAt: latest.createdAt,
        }
      : null,
    emailTransport: input.honesty.transport,
    smtpUsed: input.honesty.smtpUsed,
    controlPlane: false,
    deferredChannelsActivated: false,
    scheduler: false,
    retries: false,
    authorityClass: 'notification-projection',
  };
}

export function emailDeliveryMatches(
  delivery: DeliveryResult,
  query: ListEmailDeliveriesQuery,
): boolean {
  if (!delivery.attempts.some((attempt) => attempt.channelId === 'email')) return false;
  return deliveryMatchesQuery(delivery, query);
}

export function toEmailDeliveryPageView(items: readonly DeliveryResult[]): EmailDeliveryPageView {
  return toDeliveryPageView(items);
}

function latestEmailDelivery(deliveries: readonly DeliveryResult[]): DeliveryResult | undefined {
  return [...deliveries]
    .filter((item) => item.attempts.some((attempt) => attempt.channelId === 'email'))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
}
