/**
 * W5-N23-c — Notification Platform Retry Eligibility restart recovery foundation.
 *
 * W5-N23-b uses `buildNotificationPlatformRetryEligibilityAnchorState` for persisted-row
 * integrity only. Full restart recovery hydrate is implemented in W5-N23-c.
 * Restores eligibility description anchors only — does not evaluate eligibility, schedule, or execute retries.
 */

import {
  NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_STATES,
  type DurableNotificationPlatformRetryEligibilityAnchor,
  type NotificationPlatformRetryEligibilityAnchorState,
} from './durable-notification-platform-retry-eligibility-anchor';

export const W5_N23_C_NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformRetryEligibilityRestartRecoveryError extends Error {
  readonly owner = W5_N23_C_NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(
    code: NotificationPlatformRetryEligibilityRestartRecoveryError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'NotificationPlatformRetryEligibilityRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformRetryEligibilityRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N23_C_NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then eligibilityAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformRetryEligibilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform notification retry eligibility recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformRetryEligibilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform notification retry eligibility recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, eligibilityAnchorId: string): string {
  return `${workspaceId}:${eligibilityAnchorId}`;
}

function isEligibilityAnchorState(
  value: string,
): value is NotificationPlatformRetryEligibilityAnchorState {
  return (NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_STATES as readonly string[]).includes(
    value,
  );
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformRetryEligibilityAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformRetryEligibilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform notification retry eligibility recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformRetryEligibilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform notification retry eligibility recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['eligibilityAnchorId', anchor.eligibilityAnchorId],
    ['platformRetryEligibilityType', anchor.platformRetryEligibilityType],
    ['eligibilityAnchorState', anchor.eligibilityAnchorState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformRetryEligibilityRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform notification retry eligibility recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(
  anchor: DurableNotificationPlatformRetryEligibilityAnchor,
): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.eligibilityAnchorId.trim().length > 0 &&
    anchor.platformRetryEligibilityType.trim().length > 0 &&
    isEligibilityAnchorState(anchor.eligibilityAnchorState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Notification Retry Eligibility anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes eligibility outcomes.
 */
export function assertRecoverableNotificationPlatformRetryEligibilityAnchor(
  value: DurableNotificationPlatformRetryEligibilityAnchor,
  index = 0,
): DurableNotificationPlatformRetryEligibilityAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const eligibilityAnchorId = requireNonEmptyString(
    value.eligibilityAnchorId,
    `${prefix}.eligibilityAnchorId`,
  );
  const platformRetryEligibilityType = requireNonEmptyString(
    value.platformRetryEligibilityType,
    `${prefix}.platformRetryEligibilityType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformRetryEligibilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform notification retry eligibility recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isEligibilityAnchorState(value.eligibilityAnchorState)) {
    throw new NotificationPlatformRetryEligibilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform notification retry eligibility recovery refused invalid eligibilityAnchorState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    eligibilityAnchorId,
    platformRetryEligibilityType,
    eligibilityAnchorState: value.eligibilityAnchorState,
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
    throw new NotificationPlatformRetryEligibilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform notification retry eligibility recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then eligibilityAnchorId. */
export function sortNotificationPlatformRetryEligibilityAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetryEligibilityAnchor[],
): readonly DurableNotificationPlatformRetryEligibilityAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.eligibilityAnchorId.localeCompare(b.eligibilityAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformRetryEligibilityAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformRetryEligibilityAnchor[],
): readonly DurableNotificationPlatformRetryEligibilityAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformRetryEligibilityAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformRetryEligibilityAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.eligibilityAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformRetryEligibilityRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform notification retry eligibility recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformRetryEligibilityAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformRetryEligibilityRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformRetryEligibilityAnchor[],
): NotificationPlatformRetryEligibilityRecoveryDiagnostics {
  const ordered = sortNotificationPlatformRetryEligibilityAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N23_C_NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.eligibilityAnchorId)),
    ),
  });
}
