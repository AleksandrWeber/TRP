/**
 * W3-O02-c — Notification Durable Queue restart recovery foundation.
 *
 * Restores W3-O02-b queue work items after a normal process restart via the
 * existing notification-delivery owner hydrate path.
 *
 * Not retry execution. Not a second recovery engine / Outbox / SoT.
 * Not Business Continuity, HA, Disaster Recovery, or operator recovery UI.
 */

import { AnalyticalRestartRecoveryError } from '../../../persistence/analytical-restart-recovery';
import { isNotificationType } from './notification-type';
import {
  isNotificationQueueStatus,
  isOpenNotificationQueueStatus,
  type NotificationDeliveryQueueItem,
  type NotificationQueueStatus,
} from './delivery-queue';

export const W3_O02_C_QUEUE_RECOVERY_OWNER = 'notification-delivery' as const;

export class NotificationQueueRecoveryError extends Error {
  readonly owner = W3_O02_C_QUEUE_RECOVERY_OWNER;
  readonly code: 'CORRUPT_QUEUE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationQueueRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationQueueRecoveryError';
    this.code = code;
  }
}

export type NotificationQueueRecoveryDiagnostics = Readonly<{
  owner: typeof W3_O02_C_QUEUE_RECOVERY_OWNER;
  restoredCount: number;
  openCount: number;
  byStatus: Readonly<Record<NotificationQueueStatus, number>>;
  workspaceIds: readonly string[];
  openQueueItemIds: readonly string[];
  /** Deterministic recovery order used for diagnostics (createdAt, queueItemId). */
  recoveryOrder: readonly string[];
}>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationQueueRecoveryError(
      'CORRUPT_QUEUE',
      `Notification queue recovery refused corrupt item field "${field}"`,
    );
  }
  return value.trim();
}

/**
 * Integrity gate for a single queue item.
 * Never fabricates defaults for missing required fields.
 */
export function assertRecoverableNotificationQueueItem(
  value: unknown,
  index: number,
): NotificationDeliveryQueueItem {
  if (!isPlainObject(value)) {
    throw new NotificationQueueRecoveryError(
      'CORRUPT_QUEUE',
      `Notification queue recovery refused corrupt item at index ${index}`,
    );
  }

  const queueItemId = requireNonEmptyString(value.queueItemId, `queue[${index}].queueItemId`);
  const workspaceId = requireNonEmptyString(value.workspaceId, `queue[${index}].workspaceId`);
  const userId = requireNonEmptyString(value.userId, `queue[${index}].userId`);
  const subject = requireNonEmptyString(value.subject, `queue[${index}].subject`);
  const body = requireNonEmptyString(value.body, `queue[${index}].body`);
  const createdAt = requireNonEmptyString(value.createdAt, `queue[${index}].createdAt`);
  const updatedAt = requireNonEmptyString(value.updatedAt, `queue[${index}].updatedAt`);

  if (typeof value.type !== 'string' || !isNotificationType(value.type)) {
    throw new NotificationQueueRecoveryError(
      'CORRUPT_QUEUE',
      `Notification queue recovery refused corrupt type at index ${index}`,
    );
  }
  if (typeof value.status !== 'string' || !isNotificationQueueStatus(value.status)) {
    throw new NotificationQueueRecoveryError(
      'CORRUPT_QUEUE',
      `Notification queue recovery refused corrupt status at index ${index}`,
    );
  }

  const item: NotificationDeliveryQueueItem = Object.freeze({
    queueItemId,
    workspaceId,
    userId,
    type: value.type,
    subject,
    body,
    status: value.status,
    createdAt,
    updatedAt,
    ...(typeof value.reportRunId === 'string' && value.reportRunId.trim()
      ? { reportRunId: value.reportRunId.trim() }
      : {}),
    ...(typeof value.critical === 'boolean' ? { critical: value.critical } : {}),
    ...(typeof value.deliveryId === 'string' && value.deliveryId.trim()
      ? { deliveryId: value.deliveryId.trim() }
      : {}),
    ...(typeof value.detail === 'string' ? { detail: value.detail } : {}),
  });
  return item;
}

/**
 * Integrity gate for snapshot.queue.
 * Missing / undefined queue → empty (backward compatible with O01-only snapshots).
 * Non-array or corrupt items → fail honestly (no fabrication).
 */
export function assertRecoverableNotificationQueue(
  payload: Record<string, unknown>,
): readonly NotificationDeliveryQueueItem[] {
  if (!Object.prototype.hasOwnProperty.call(payload, 'queue') || payload.queue === undefined) {
    return Object.freeze([]);
  }
  if (!Array.isArray(payload.queue)) {
    throw new NotificationQueueRecoveryError(
      'CORRUPT_QUEUE',
      'Notification queue recovery refused corrupt queue field (expected array)',
    );
  }

  const seen = new Set<string>();
  const items: NotificationDeliveryQueueItem[] = [];
  for (let i = 0; i < payload.queue.length; i += 1) {
    const item = assertRecoverableNotificationQueueItem(payload.queue[i], i);
    if (seen.has(item.queueItemId)) {
      throw new NotificationQueueRecoveryError(
        'CORRUPT_QUEUE',
        `Notification queue recovery refused duplicate queueItemId "${item.queueItemId}"`,
      );
    }
    seen.add(item.queueItemId);
    items.push(item);
  }
  return Object.freeze(sortQueueItemsDeterministically(items));
}

/** Deterministic recovery order: createdAt ascending, then queueItemId. */
export function sortQueueItemsDeterministically(
  items: readonly NotificationDeliveryQueueItem[],
): readonly NotificationDeliveryQueueItem[] {
  return Object.freeze(
    [...items].sort((a, b) => {
      const byCreated = a.createdAt.localeCompare(b.createdAt);
      if (byCreated !== 0) return byCreated;
      return a.queueItemId.localeCompare(b.queueItemId);
    }),
  );
}

export function buildNotificationQueueRecoveryDiagnostics(
  items: readonly NotificationDeliveryQueueItem[],
): NotificationQueueRecoveryDiagnostics {
  const byStatus = Object.freeze({
    pending: 0,
    'in-flight': 0,
    retryable: 0,
    completed: 0,
    failed: 0,
  }) as Record<NotificationQueueStatus, number>;
  const mutable: Record<NotificationQueueStatus, number> = { ...byStatus };
  const workspaceIds = new Set<string>();
  const openIds: string[] = [];

  for (const item of items) {
    mutable[item.status] += 1;
    workspaceIds.add(item.workspaceId);
    if (isOpenNotificationQueueStatus(item.status)) {
      openIds.push(item.queueItemId);
    }
  }

  const ordered = sortQueueItemsDeterministically(items);
  return Object.freeze({
    owner: W3_O02_C_QUEUE_RECOVERY_OWNER,
    restoredCount: items.length,
    openCount: openIds.length,
    byStatus: Object.freeze({ ...mutable }),
    workspaceIds: Object.freeze([...workspaceIds].sort()),
    openQueueItemIds: Object.freeze(openIds.sort()),
    recoveryOrder: Object.freeze(ordered.map((item) => item.queueItemId)),
  });
}

/**
 * Prepare a durable notification snapshot payload for hydrate/import.
 * Validates queue integrity; preserves other owner fields unchanged.
 * Throws AnalyticalRestartRecoveryError-compatible failures for corrupt queue.
 */
export function prepareNotificationStoreStateForRecovery(
  payload: Record<string, unknown>,
): Record<string, unknown> & { queue: readonly NotificationDeliveryQueueItem[] } {
  try {
    const queue = assertRecoverableNotificationQueue(payload);
    return Object.freeze({
      ...payload,
      queue,
    });
  } catch (error) {
    if (error instanceof NotificationQueueRecoveryError) {
      throw new AnalyticalRestartRecoveryError(
        W3_O02_C_QUEUE_RECOVERY_OWNER,
        'CORRUPT_SNAPSHOT',
        error.message,
      );
    }
    throw error;
  }
}
