/**
 * W3-O02-b — Notification Durable Queue work item (TD-045 / NT-02).
 *
 * In-flight / pending / retryable delivery work owned by notification-delivery.
 * Distinct from DeliveryResult history (W3-O01), paper Outbox (TD-035),
 * and Wave 5 production transports.
 *
 * Persistence foundation only — not restart recovery, not retry execution.
 */

import type { DeliverNotificationCommand } from './delivery';
import type { NotificationType } from './notification-type';

export const NOTIFICATION_QUEUE_STATUSES = Object.freeze([
  'pending',
  'in-flight',
  'retryable',
  'completed',
  'failed',
] as const);

export type NotificationQueueStatus = (typeof NOTIFICATION_QUEUE_STATUSES)[number];

/** Statuses that represent unfinished owed delivery work. */
export const NOTIFICATION_QUEUE_OPEN_STATUSES = Object.freeze([
  'pending',
  'in-flight',
  'retryable',
] as const);

export type NotificationQueueOpenStatus = (typeof NOTIFICATION_QUEUE_OPEN_STATUSES)[number];

export type NotificationDeliveryQueueItem = Readonly<{
  queueItemId: string;
  workspaceId: string;
  userId: string;
  type: NotificationType;
  subject: string;
  body: string;
  reportRunId?: string;
  critical?: boolean;
  status: NotificationQueueStatus;
  /** Correlates to DeliveryResult.deliveryId when history is recorded. */
  deliveryId?: string;
  detail?: string;
  createdAt: string;
  updatedAt: string;
}>;

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Object.isFrozen(value)) return value;
  for (const key of Object.keys(value as object)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

export function isNotificationQueueStatus(value: string): value is NotificationQueueStatus {
  return (NOTIFICATION_QUEUE_STATUSES as readonly string[]).includes(value);
}

export function isOpenNotificationQueueStatus(
  value: NotificationQueueStatus,
): value is NotificationQueueOpenStatus {
  return (NOTIFICATION_QUEUE_OPEN_STATUSES as readonly string[]).includes(value);
}

export function createPendingNotificationQueueItem(input: {
  queueItemId: string;
  command: DeliverNotificationCommand;
  createdAt?: string;
}): NotificationDeliveryQueueItem {
  const workspaceId = input.command.workspaceId.trim();
  const userId = input.command.userId.trim();
  if (!workspaceId) {
    throw new Error('Notification queue item requires workspaceId');
  }
  if (!userId) {
    throw new Error('Notification queue item requires userId');
  }
  const createdAt = input.createdAt?.trim() || input.command.requestedAt;
  return deepFreeze({
    queueItemId: input.queueItemId,
    workspaceId,
    userId,
    type: input.command.type,
    subject: input.command.subject,
    body: input.command.body,
    ...(input.command.reportRunId ? { reportRunId: input.command.reportRunId } : {}),
    ...(input.command.critical !== undefined ? { critical: input.command.critical } : {}),
    status: 'pending' as const,
    createdAt,
    updatedAt: createdAt,
  });
}

export function withNotificationQueueStatus(
  item: NotificationDeliveryQueueItem,
  status: NotificationQueueStatus,
  patch: Readonly<{
    updatedAt: string;
    deliveryId?: string;
    detail?: string;
  }>,
): NotificationDeliveryQueueItem {
  return deepFreeze({
    ...item,
    status,
    updatedAt: patch.updatedAt,
    ...(patch.deliveryId !== undefined ? { deliveryId: patch.deliveryId } : {}),
    ...(patch.detail !== undefined ? { detail: patch.detail } : {}),
  });
}

export function queueItemToDeliverCommand(
  item: NotificationDeliveryQueueItem,
): DeliverNotificationCommand {
  return Object.freeze({
    workspaceId: item.workspaceId,
    userId: item.userId,
    type: item.type,
    subject: item.subject,
    body: item.body,
    ...(item.reportRunId ? { reportRunId: item.reportRunId } : {}),
    ...(item.critical !== undefined ? { critical: item.critical } : {}),
    requestedAt: item.createdAt,
  });
}
