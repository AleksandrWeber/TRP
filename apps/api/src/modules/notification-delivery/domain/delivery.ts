/**
 * RC-24 Epic 6 — Delivery request / result artifacts (immutable).
 */

import type { NotificationChannelId } from './notification-channel';
import type { NotificationType } from './notification-type';

export const DELIVERY_OUTCOMES = Object.freeze(['delivered', 'skipped', 'failed'] as const);

export type DeliveryOutcome = (typeof DELIVERY_OUTCOMES)[number];

export const DELIVERY_SKIP_REASONS = Object.freeze([
  'notifications-disabled',
  'type-disabled',
  'channel-disabled',
  'channel-reserved',
  'channel-not-connected',
  'quiet-hours',
  'no-routes',
] as const);

export type DeliverySkipReason = (typeof DELIVERY_SKIP_REASONS)[number];

export type DeliverNotificationCommand = Readonly<{
  workspaceId: string;
  userId: string;
  type: NotificationType;
  subject: string;
  body: string;
  /** Opaque report reference — Notification never generates reports. */
  reportRunId?: string;
  /** When true, treat as critical regardless of type catalog. */
  critical?: boolean;
  requestedAt: string;
}>;

export type ChannelDeliveryAttempt = Readonly<{
  channelId: NotificationChannelId;
  outcome: DeliveryOutcome;
  skipReason?: DeliverySkipReason;
  detail?: string;
}>;

export type DeliveryResult = Readonly<{
  deliveryId: string;
  workspaceId: string;
  userId: string;
  type: NotificationType;
  reportRunId?: string;
  attempts: readonly ChannelDeliveryAttempt[];
  outcome: DeliveryOutcome;
  createdAt: string;
}>;

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Object.isFrozen(value)) return value;
  for (const key of Object.keys(value as object)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

export function createDeliveryResult(input: {
  deliveryId: string;
  workspaceId: string;
  userId: string;
  type: NotificationType;
  reportRunId?: string;
  attempts: readonly ChannelDeliveryAttempt[];
  createdAt: string;
}): DeliveryResult {
  const hasDelivered = input.attempts.some((a) => a.outcome === 'delivered');
  const hasFailed = input.attempts.some((a) => a.outcome === 'failed');
  const outcome: DeliveryOutcome = hasDelivered ? 'delivered' : hasFailed ? 'failed' : 'skipped';

  return deepFreeze({
    deliveryId: input.deliveryId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    type: input.type,
    ...(input.reportRunId ? { reportRunId: input.reportRunId } : {}),
    attempts: Object.freeze([...input.attempts]),
    outcome,
    createdAt: input.createdAt,
  });
}
