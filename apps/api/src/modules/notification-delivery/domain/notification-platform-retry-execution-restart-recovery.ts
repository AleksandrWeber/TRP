/**
 * W5-N18-c — Notification Platform Retry Execution restart recovery foundation.
 *
 * W5-N18-b uses `buildNotificationPlatformRetryExecutionAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N18-c.
 */

import {
  NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_STATES,
  type DurableNotificationPlatformRetryExecutionAnchor,
  type NotificationPlatformRetryExecutionAnchorState,
} from './durable-notification-platform-retry-execution-anchor';

export const W5_N18_C_NOTIFICATION_PLATFORM_RETRY_EXECUTION_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformRetryExecutionRestartRecoveryError extends Error {
  readonly owner = W5_N18_C_NOTIFICATION_PLATFORM_RETRY_EXECUTION_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(
    code: NotificationPlatformRetryExecutionRestartRecoveryError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'NotificationPlatformRetryExecutionRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformRetryExecutionRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N18_C_NOTIFICATION_PLATFORM_RETRY_EXECUTION_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then retryExecutionAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformRetryExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry execution recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformRetryExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry execution recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, retryExecutionAnchorId: string): string {
  return `${workspaceId}:${retryExecutionAnchorId}`;
}

function isRetryExecutionState(
  value: string,
): value is NotificationPlatformRetryExecutionAnchorState {
  return (NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformRetryExecutionAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformRetryExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry execution recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformRetryExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry execution recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['retryExecutionAnchorId', anchor.retryExecutionAnchorId],
    ['platformRetryExecutionType', anchor.platformRetryExecutionType],
    ['retryExecutionState', anchor.retryExecutionState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformRetryExecutionRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry execution recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(
  anchor: DurableNotificationPlatformRetryExecutionAnchor,
): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.retryExecutionAnchorId.trim().length > 0 &&
    anchor.platformRetryExecutionType.trim().length > 0 &&
    isRetryExecutionState(anchor.retryExecutionState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Retry Execution anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes retry outcomes.
 */
export function assertRecoverableNotificationPlatformRetryExecutionAnchor(
  value: DurableNotificationPlatformRetryExecutionAnchor,
  index = 0,
): DurableNotificationPlatformRetryExecutionAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const retryExecutionAnchorId = requireNonEmptyString(
    value.retryExecutionAnchorId,
    `${prefix}.retryExecutionAnchorId`,
  );
  const platformRetryExecutionType = requireNonEmptyString(
    value.platformRetryExecutionType,
    `${prefix}.platformRetryExecutionType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformRetryExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry execution recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isRetryExecutionState(value.retryExecutionState)) {
    throw new NotificationPlatformRetryExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry execution recovery refused invalid retryExecutionState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    retryExecutionAnchorId,
    platformRetryExecutionType,
    retryExecutionState: value.retryExecutionState,
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
    throw new NotificationPlatformRetryExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry execution recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then retryExecutionAnchorId. */
export function sortNotificationPlatformRetryExecutionAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetryExecutionAnchor[],
): readonly DurableNotificationPlatformRetryExecutionAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.retryExecutionAnchorId.localeCompare(b.retryExecutionAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformRetryExecutionAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformRetryExecutionAnchor[],
): readonly DurableNotificationPlatformRetryExecutionAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformRetryExecutionAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformRetryExecutionAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.retryExecutionAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformRetryExecutionRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry execution recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformRetryExecutionAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformRetryExecutionRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformRetryExecutionAnchor[],
): NotificationPlatformRetryExecutionRecoveryDiagnostics {
  const ordered = sortNotificationPlatformRetryExecutionAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N18_C_NOTIFICATION_PLATFORM_RETRY_EXECUTION_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.retryExecutionAnchorId)),
    ),
  });
}
