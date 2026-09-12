/**
 * W5-N20-c — Notification Platform Retry Policy restart recovery foundation.
 *
 * W5-N20-b uses `buildNotificationPlatformRetryPolicyAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N20-c.
 */

import {
  NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_STATES,
  type DurableNotificationPlatformRetryPolicyAnchor,
  type NotificationPlatformRetryPolicyAnchorState,
} from './durable-notification-platform-retry-policy-anchor';

export const W5_N20_C_NOTIFICATION_PLATFORM_RETRY_POLICY_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformRetryPolicyRestartRecoveryError extends Error {
  readonly owner = W5_N20_C_NOTIFICATION_PLATFORM_RETRY_POLICY_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationPlatformRetryPolicyRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationPlatformRetryPolicyRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformRetryPolicyRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N20_C_NOTIFICATION_PLATFORM_RETRY_POLICY_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then retryPolicyAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformRetryPolicyRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry policy recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformRetryPolicyRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry policy recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, retryPolicyAnchorId: string): string {
  return `${workspaceId}:${retryPolicyAnchorId}`;
}

function isRetryPolicyState(value: string): value is NotificationPlatformRetryPolicyAnchorState {
  return (NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformRetryPolicyAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformRetryPolicyRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry policy recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformRetryPolicyRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry policy recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['retryPolicyAnchorId', anchor.retryPolicyAnchorId],
    ['platformRetryPolicyType', anchor.platformRetryPolicyType],
    ['retryPolicyState', anchor.retryPolicyState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformRetryPolicyRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry policy recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformRetryPolicyAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.retryPolicyAnchorId.trim().length > 0 &&
    anchor.platformRetryPolicyType.trim().length > 0 &&
    isRetryPolicyState(anchor.retryPolicyState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Retry Policy anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes policy evaluation outcomes.
 */
export function assertRecoverableNotificationPlatformRetryPolicyAnchor(
  value: DurableNotificationPlatformRetryPolicyAnchor,
  index = 0,
): DurableNotificationPlatformRetryPolicyAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const retryPolicyAnchorId = requireNonEmptyString(
    value.retryPolicyAnchorId,
    `${prefix}.retryPolicyAnchorId`,
  );
  const platformRetryPolicyType = requireNonEmptyString(
    value.platformRetryPolicyType,
    `${prefix}.platformRetryPolicyType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformRetryPolicyRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry policy recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isRetryPolicyState(value.retryPolicyState)) {
    throw new NotificationPlatformRetryPolicyRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry policy recovery refused invalid retryPolicyState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    retryPolicyAnchorId,
    platformRetryPolicyType,
    retryPolicyState: value.retryPolicyState,
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
    throw new NotificationPlatformRetryPolicyRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry policy recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then retryPolicyAnchorId. */
export function sortNotificationPlatformRetryPolicyAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetryPolicyAnchor[],
): readonly DurableNotificationPlatformRetryPolicyAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.retryPolicyAnchorId.localeCompare(b.retryPolicyAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformRetryPolicyAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformRetryPolicyAnchor[],
): readonly DurableNotificationPlatformRetryPolicyAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformRetryPolicyAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformRetryPolicyAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.retryPolicyAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformRetryPolicyRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry policy recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformRetryPolicyAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformRetryPolicyRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformRetryPolicyAnchor[],
): NotificationPlatformRetryPolicyRecoveryDiagnostics {
  const ordered = sortNotificationPlatformRetryPolicyAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N20_C_NOTIFICATION_PLATFORM_RETRY_POLICY_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.retryPolicyAnchorId)),
    ),
  });
}
