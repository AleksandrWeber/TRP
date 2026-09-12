/**
 * W5-N25-c — Notification Platform Retry Scheduling Decision restart recovery foundation.
 *
 * W5-N25-b uses `buildNotificationPlatformRetrySchedulingDecisionAnchorState` for persisted-row
 * integrity only. Full restart recovery hydrate is implemented in W5-N25-c.
 * Restores decision description anchors only — does not perform runtime decision logic,
 * schedule, determine eligibility, calculate backoff, or execute retries.
 */

import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_STATES,
  type DurableNotificationPlatformRetrySchedulingDecisionAnchor,
  type NotificationPlatformRetrySchedulingDecisionAnchorState,
} from './durable-notification-platform-retry-scheduling-decision-anchor';

export const W5_N25_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformRetrySchedulingDecisionRestartRecoveryError extends Error {
  readonly owner = W5_N25_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(
    code: NotificationPlatformRetrySchedulingDecisionRestartRecoveryError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'NotificationPlatformRetrySchedulingDecisionRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N25_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then decisionAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformRetrySchedulingDecisionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformRetrySchedulingDecisionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, decisionAnchorId: string): string {
  return `${workspaceId}:${decisionAnchorId}`;
}

function isDecisionAnchorState(
  value: string,
): value is NotificationPlatformRetrySchedulingDecisionAnchorState {
  return (
    NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_STATES as readonly string[]
  ).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformRetrySchedulingDecisionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformRetrySchedulingDecisionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['decisionAnchorId', anchor.decisionAnchorId],
    ['platformRetrySchedulingDecisionType', anchor.platformRetrySchedulingDecisionType],
    ['decisionAnchorState', anchor.decisionAnchorState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformRetrySchedulingDecisionRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry scheduling decision recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionAnchor,
): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.decisionAnchorId.trim().length > 0 &&
    anchor.platformRetrySchedulingDecisionType.trim().length > 0 &&
    isDecisionAnchorState(anchor.decisionAnchorState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Retry Scheduling Decision anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes decision outcomes.
 */
export function assertRecoverableNotificationPlatformRetrySchedulingDecisionAnchor(
  value: DurableNotificationPlatformRetrySchedulingDecisionAnchor,
  index = 0,
): DurableNotificationPlatformRetrySchedulingDecisionAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const decisionAnchorId = requireNonEmptyString(
    value.decisionAnchorId,
    `${prefix}.decisionAnchorId`,
  );
  const platformRetrySchedulingDecisionType = requireNonEmptyString(
    value.platformRetrySchedulingDecisionType,
    `${prefix}.platformRetrySchedulingDecisionType`,
  );

  if (
    value.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_SCHEMA_VERSION
  ) {
    throw new NotificationPlatformRetrySchedulingDecisionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isDecisionAnchorState(value.decisionAnchorState)) {
    throw new NotificationPlatformRetrySchedulingDecisionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision recovery refused invalid decisionAnchorState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    decisionAnchorId,
    platformRetrySchedulingDecisionType,
    decisionAnchorState: value.decisionAnchorState,
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
    throw new NotificationPlatformRetrySchedulingDecisionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then decisionAnchorId. */
export function sortNotificationPlatformRetrySchedulingDecisionAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.decisionAnchorId.localeCompare(b.decisionAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformRetrySchedulingDecisionAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformRetrySchedulingDecisionAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformRetrySchedulingDecisionAnchor(
      anchors[i]!,
      i,
    );
    const key = compositeKey(anchor.workspaceId, anchor.decisionAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformRetrySchedulingDecisionRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry scheduling decision recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformRetrySchedulingDecisionAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[],
): NotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics {
  const ordered = sortNotificationPlatformRetrySchedulingDecisionAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N25_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.decisionAnchorId)),
    ),
  });
}
