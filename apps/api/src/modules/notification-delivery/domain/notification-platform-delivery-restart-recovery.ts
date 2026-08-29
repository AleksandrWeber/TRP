/**
 * W5-N06-c — Notification Platform Delivery restart recovery foundation.
 *
 * W5-N06-b uses `buildNotificationPlatformDeliveryAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N06-c.
 */

import {
  NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_STATES,
  type DurableNotificationPlatformDeliveryAnchor,
  type NotificationPlatformDeliveryAnchorState,
} from './durable-notification-platform-delivery-anchor';

export const W5_N06_C_NOTIFICATION_PLATFORM_DELIVERY_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformDeliveryRestartRecoveryError extends Error {
  readonly owner = W5_N06_C_NOTIFICATION_PLATFORM_DELIVERY_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationPlatformDeliveryRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationPlatformDeliveryRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformDeliveryRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N06_C_NOTIFICATION_PLATFORM_DELIVERY_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then deliveryAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformDeliveryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformDeliveryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, deliveryAnchorId: string): string {
  return `${workspaceId}:${deliveryAnchorId}`;
}

function isDeliveryState(value: string): value is NotificationPlatformDeliveryAnchorState {
  return (NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformDeliveryAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformDeliveryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformDeliveryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['deliveryAnchorId', anchor.deliveryAnchorId],
    ['platformDeliveryType', anchor.platformDeliveryType],
    ['deliveryState', anchor.deliveryState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformDeliveryRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform delivery recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformDeliveryAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.deliveryAnchorId.trim().length > 0 &&
    anchor.platformDeliveryType.trim().length > 0 &&
    isDeliveryState(anchor.deliveryState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Delivery anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes delivery outcomes.
 */
export function assertRecoverableNotificationPlatformDeliveryAnchor(
  value: DurableNotificationPlatformDeliveryAnchor,
  index = 0,
): DurableNotificationPlatformDeliveryAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const deliveryAnchorId = requireNonEmptyString(
    value.deliveryAnchorId,
    `${prefix}.deliveryAnchorId`,
  );
  const platformDeliveryType = requireNonEmptyString(
    value.platformDeliveryType,
    `${prefix}.platformDeliveryType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformDeliveryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isDeliveryState(value.deliveryState)) {
    throw new NotificationPlatformDeliveryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery recovery refused invalid deliveryState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    deliveryAnchorId,
    platformDeliveryType,
    deliveryState: value.deliveryState,
    channelScope: value.channelScope,
    integrityMetadata: value.integrityMetadata,
    correlationId: value.correlationId,
    schemaVersion: value.schemaVersion,
    recordedAt: value.recordedAt,
    recordedByActorId: value.recordedByActorId,
    updatedAt: value.updatedAt,
  });

  assertIntegrityMetadataMatchesAnchor(anchor, prefix);

  if (!hasCanonicalAnchorFields(anchor)) {
    throw new NotificationPlatformDeliveryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then deliveryAnchorId. */
export function sortNotificationPlatformDeliveryAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformDeliveryAnchor[],
): readonly DurableNotificationPlatformDeliveryAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.deliveryAnchorId.localeCompare(b.deliveryAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformDeliveryAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformDeliveryAnchor[],
): readonly DurableNotificationPlatformDeliveryAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformDeliveryAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformDeliveryAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.deliveryAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformDeliveryRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform delivery recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformDeliveryAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformDeliveryRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformDeliveryAnchor[],
): NotificationPlatformDeliveryRecoveryDiagnostics {
  const ordered = sortNotificationPlatformDeliveryAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N06_C_NOTIFICATION_PLATFORM_DELIVERY_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.deliveryAnchorId)),
    ),
  });
}
