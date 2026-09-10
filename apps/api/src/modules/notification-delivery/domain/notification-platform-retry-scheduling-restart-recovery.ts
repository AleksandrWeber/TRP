/**
 * W5-N19-c — Notification Platform Retry Scheduling restart recovery foundation.
 *
 * W5-N19-b uses `buildNotificationPlatformRetrySchedulingAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N19-c.
 */

import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_STATES,
  type DurableNotificationPlatformRetrySchedulingAnchor,
  type NotificationPlatformRetrySchedulingAnchorState,
} from './durable-notification-platform-retry-scheduling-anchor';

export const W5_N19_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformRetrySchedulingRestartRecoveryError extends Error {
  readonly owner = W5_N19_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(
    code: NotificationPlatformRetrySchedulingRestartRecoveryError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'NotificationPlatformRetrySchedulingRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformRetrySchedulingRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N19_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then retrySchedulingAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformRetrySchedulingRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformRetrySchedulingRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, retrySchedulingAnchorId: string): string {
  return `${workspaceId}:${retrySchedulingAnchorId}`;
}

function isRetrySchedulingState(
  value: string,
): value is NotificationPlatformRetrySchedulingAnchorState {
  return (NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_STATES as readonly string[]).includes(
    value,
  );
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformRetrySchedulingAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformRetrySchedulingRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformRetrySchedulingRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['retrySchedulingAnchorId', anchor.retrySchedulingAnchorId],
    ['platformRetrySchedulingType', anchor.platformRetrySchedulingType],
    ['retrySchedulingState', anchor.retrySchedulingState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformRetrySchedulingRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry scheduling recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(
  anchor: DurableNotificationPlatformRetrySchedulingAnchor,
): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.retrySchedulingAnchorId.trim().length > 0 &&
    anchor.platformRetrySchedulingType.trim().length > 0 &&
    isRetrySchedulingState(anchor.retrySchedulingState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Retry Scheduling anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes scheduling outcomes.
 */
export function assertRecoverableNotificationPlatformRetrySchedulingAnchor(
  value: DurableNotificationPlatformRetrySchedulingAnchor,
  index = 0,
): DurableNotificationPlatformRetrySchedulingAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const retrySchedulingAnchorId = requireNonEmptyString(
    value.retrySchedulingAnchorId,
    `${prefix}.retrySchedulingAnchorId`,
  );
  const platformRetrySchedulingType = requireNonEmptyString(
    value.platformRetrySchedulingType,
    `${prefix}.platformRetrySchedulingType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformRetrySchedulingRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isRetrySchedulingState(value.retrySchedulingState)) {
    throw new NotificationPlatformRetrySchedulingRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling recovery refused invalid retrySchedulingState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    retrySchedulingAnchorId,
    platformRetrySchedulingType,
    retrySchedulingState: value.retrySchedulingState,
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
    throw new NotificationPlatformRetrySchedulingRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then retrySchedulingAnchorId. */
export function sortNotificationPlatformRetrySchedulingAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetrySchedulingAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.retrySchedulingAnchorId.localeCompare(b.retrySchedulingAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformRetrySchedulingAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformRetrySchedulingAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformRetrySchedulingAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformRetrySchedulingAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.retrySchedulingAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformRetrySchedulingRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry scheduling recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformRetrySchedulingAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformRetrySchedulingRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformRetrySchedulingAnchor[],
): NotificationPlatformRetrySchedulingRecoveryDiagnostics {
  const ordered = sortNotificationPlatformRetrySchedulingAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N19_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.retrySchedulingAnchorId)),
    ),
  });
}
