/**
 * W5-N21-c — Notification Platform Retry Backoff restart recovery foundation.
 *
 * W5-N21-b uses `buildNotificationPlatformRetryBackoffAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N21-c.
 */

import {
  NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_STATES,
  type DurableNotificationPlatformRetryBackoffAnchor,
  type NotificationPlatformRetryBackoffAnchorState,
} from './durable-notification-platform-retry-backoff-anchor';

export const W5_N21_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformRetryBackoffRestartRecoveryError extends Error {
  readonly owner = W5_N21_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationPlatformRetryBackoffRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationPlatformRetryBackoffRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformRetryBackoffRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N21_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then retryBackoffAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformRetryBackoffRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformRetryBackoffRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, retryBackoffAnchorId: string): string {
  return `${workspaceId}:${retryBackoffAnchorId}`;
}

function isRetryBackoffState(value: string): value is NotificationPlatformRetryBackoffAnchorState {
  return (NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformRetryBackoffAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformRetryBackoffRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformRetryBackoffRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['retryBackoffAnchorId', anchor.retryBackoffAnchorId],
    ['platformRetryBackoffType', anchor.platformRetryBackoffType],
    ['retryBackoffState', anchor.retryBackoffState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformRetryBackoffRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry backoff recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformRetryBackoffAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.retryBackoffAnchorId.trim().length > 0 &&
    anchor.platformRetryBackoffType.trim().length > 0 &&
    isRetryBackoffState(anchor.retryBackoffState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Retry Backoff anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes backoff calculation outcomes.
 */
export function assertRecoverableNotificationPlatformRetryBackoffAnchor(
  value: DurableNotificationPlatformRetryBackoffAnchor,
  index = 0,
): DurableNotificationPlatformRetryBackoffAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const retryBackoffAnchorId = requireNonEmptyString(
    value.retryBackoffAnchorId,
    `${prefix}.retryBackoffAnchorId`,
  );
  const platformRetryBackoffType = requireNonEmptyString(
    value.platformRetryBackoffType,
    `${prefix}.platformRetryBackoffType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformRetryBackoffRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isRetryBackoffState(value.retryBackoffState)) {
    throw new NotificationPlatformRetryBackoffRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff recovery refused invalid retryBackoffState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    retryBackoffAnchorId,
    platformRetryBackoffType,
    retryBackoffState: value.retryBackoffState,
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
    throw new NotificationPlatformRetryBackoffRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then retryBackoffAnchorId. */
export function sortNotificationPlatformRetryBackoffAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetryBackoffAnchor[],
): readonly DurableNotificationPlatformRetryBackoffAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.retryBackoffAnchorId.localeCompare(b.retryBackoffAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformRetryBackoffAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformRetryBackoffAnchor[],
): readonly DurableNotificationPlatformRetryBackoffAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformRetryBackoffAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformRetryBackoffAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.retryBackoffAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformRetryBackoffRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry backoff recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformRetryBackoffAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformRetryBackoffRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformRetryBackoffAnchor[],
): NotificationPlatformRetryBackoffRecoveryDiagnostics {
  const ordered = sortNotificationPlatformRetryBackoffAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N21_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.retryBackoffAnchorId)),
    ),
  });
}
