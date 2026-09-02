/**
 * W5-N13-c — Notification Platform Retry restart recovery foundation.
 *
 * W5-N13-b uses `buildNotificationPlatformRetryAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N13-c.
 */

import {
  NOTIFICATION_PLATFORM_RETRY_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_RETRY_ANCHOR_STATES,
  type DurableNotificationPlatformRetryAnchor,
  type NotificationPlatformRetryAnchorState,
} from './durable-notification-platform-retry-anchor';

export const W5_N13_C_NOTIFICATION_PLATFORM_RETRY_RECOVERY_OWNER = 'notification-delivery' as const;

export class NotificationPlatformRetryRestartRecoveryError extends Error {
  readonly owner = W5_N13_C_NOTIFICATION_PLATFORM_RETRY_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationPlatformRetryRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationPlatformRetryRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformRetryRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N13_C_NOTIFICATION_PLATFORM_RETRY_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then retryAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformRetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformRetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, retryAnchorId: string): string {
  return `${workspaceId}:${retryAnchorId}`;
}

function isRetryState(value: string): value is NotificationPlatformRetryAnchorState {
  return (NOTIFICATION_PLATFORM_RETRY_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformRetryAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformRetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformRetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['retryAnchorId', anchor.retryAnchorId],
    ['platformRetryType', anchor.platformRetryType],
    ['retryState', anchor.retryState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformRetryRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformRetryAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.retryAnchorId.trim().length > 0 &&
    anchor.platformRetryType.trim().length > 0 &&
    isRetryState(anchor.retryState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Retry anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes retry outcomes.
 */
export function assertRecoverableNotificationPlatformRetryAnchor(
  value: DurableNotificationPlatformRetryAnchor,
  index = 0,
): DurableNotificationPlatformRetryAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const retryAnchorId = requireNonEmptyString(value.retryAnchorId, `${prefix}.retryAnchorId`);
  const platformRetryType = requireNonEmptyString(
    value.platformRetryType,
    `${prefix}.platformRetryType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformRetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isRetryState(value.retryState)) {
    throw new NotificationPlatformRetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry recovery refused invalid retryState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    retryAnchorId,
    platformRetryType,
    retryState: value.retryState,
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
    throw new NotificationPlatformRetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then retryAnchorId. */
export function sortNotificationPlatformRetryAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetryAnchor[],
): readonly DurableNotificationPlatformRetryAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.retryAnchorId.localeCompare(b.retryAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformRetryAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformRetryAnchor[],
): readonly DurableNotificationPlatformRetryAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformRetryAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformRetryAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.retryAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformRetryRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformRetryAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformRetryRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformRetryAnchor[],
): NotificationPlatformRetryRecoveryDiagnostics {
  const ordered = sortNotificationPlatformRetryAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N13_C_NOTIFICATION_PLATFORM_RETRY_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.retryAnchorId)),
    ),
  });
}
