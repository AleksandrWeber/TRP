/**
 * W5-N27-c — Notification Platform Retry Scheduling Decision Projection restart recovery foundation.
 *
 * W5-N27-b uses `buildNotificationPlatformRetrySchedulingDecisionProjectionAnchorState` for persisted-row
 * integrity only. Full restart recovery hydrate is implemented in W5-N27-c.
 * Restores decision projection description anchors only — does not perform runtime decision projection,
 * schedule, determine eligibility, calculate backoff, or execute retries.
 */

import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_STATES,
  type DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor,
  type NotificationPlatformRetrySchedulingDecisionProjectionAnchorState,
} from './durable-notification-platform-retry-scheduling-decision-projection-anchor';

export const W5_N27_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError extends Error {
  readonly owner = W5_N27_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(
    code: NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N27_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then projectionAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, projectionAnchorId: string): string {
  return `${workspaceId}:${projectionAnchorId}`;
}

function isDecisionAnchorState(
  value: string,
): value is NotificationPlatformRetrySchedulingDecisionProjectionAnchorState {
  return (
    NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_STATES as readonly string[]
  ).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['projectionAnchorId', anchor.projectionAnchorId],
    [
      'platformRetrySchedulingDecisionProjectionType',
      anchor.platformRetrySchedulingDecisionProjectionType,
    ],
    ['projectionAnchorState', anchor.projectionAnchorState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry scheduling decision projection recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor,
): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.projectionAnchorId.trim().length > 0 &&
    anchor.platformRetrySchedulingDecisionProjectionType.trim().length > 0 &&
    isDecisionAnchorState(anchor.projectionAnchorState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Retry Scheduling Decision Projection anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes decision outcomes.
 */
export function assertRecoverableNotificationPlatformRetrySchedulingDecisionProjectionAnchor(
  value: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor,
  index = 0,
): DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const projectionAnchorId = requireNonEmptyString(
    value.projectionAnchorId,
    `${prefix}.projectionAnchorId`,
  );
  const platformRetrySchedulingDecisionProjectionType = requireNonEmptyString(
    value.platformRetrySchedulingDecisionProjectionType,
    `${prefix}.platformRetrySchedulingDecisionProjectionType`,
  );

  if (
    value.schemaVersion !==
    NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_SCHEMA_VERSION
  ) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isDecisionAnchorState(value.projectionAnchorState)) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection recovery refused invalid projectionAnchorState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    projectionAnchorId,
    platformRetrySchedulingDecisionProjectionType,
    projectionAnchorState: value.projectionAnchorState,
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
    throw new NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then projectionAnchorId. */
export function sortNotificationPlatformRetrySchedulingDecisionProjectionAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.projectionAnchorId.localeCompare(b.projectionAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformRetrySchedulingDecisionProjectionAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformRetrySchedulingDecisionProjectionAnchor(
      anchors[i]!,
      i,
    );
    const key = compositeKey(anchor.workspaceId, anchor.projectionAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry scheduling decision projection recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformRetrySchedulingDecisionProjectionAnchorsDeterministically(
    recovered,
  );
}

export function buildNotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[],
): NotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics {
  const ordered =
    sortNotificationPlatformRetrySchedulingDecisionProjectionAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N27_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.projectionAnchorId)),
    ),
  });
}
