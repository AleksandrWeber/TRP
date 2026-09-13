/**
 * W5-N26-c — Notification Platform Retry Scheduling Decision Evaluation restart recovery foundation.
 *
 * W5-N26-b uses `buildNotificationPlatformRetrySchedulingDecisionEvaluationAnchorState` for persisted-row
 * integrity only. Full restart recovery hydrate is implemented in W5-N26-c.
 * Restores decision evaluation description anchors only — does not perform runtime decision evaluation,
 * schedule, determine eligibility, calculate backoff, or execute retries.
 */

import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_STATES,
  type DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor,
  type NotificationPlatformRetrySchedulingDecisionEvaluationAnchorState,
} from './durable-notification-platform-retry-scheduling-decision-evaluation-anchor';

export const W5_N26_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformRetrySchedulingDecisionEvaluationRestartRecoveryError extends Error {
  readonly owner = W5_N26_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(
    code: NotificationPlatformRetrySchedulingDecisionEvaluationRestartRecoveryError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'NotificationPlatformRetrySchedulingDecisionEvaluationRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N26_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then evaluationAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformRetrySchedulingDecisionEvaluationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision evaluation recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformRetrySchedulingDecisionEvaluationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision evaluation recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, evaluationAnchorId: string): string {
  return `${workspaceId}:${evaluationAnchorId}`;
}

function isDecisionAnchorState(
  value: string,
): value is NotificationPlatformRetrySchedulingDecisionEvaluationAnchorState {
  return (
    NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_STATES as readonly string[]
  ).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformRetrySchedulingDecisionEvaluationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision evaluation recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformRetrySchedulingDecisionEvaluationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision evaluation recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['evaluationAnchorId', anchor.evaluationAnchorId],
    [
      'platformRetrySchedulingDecisionEvaluationType',
      anchor.platformRetrySchedulingDecisionEvaluationType,
    ],
    ['evaluationAnchorState', anchor.evaluationAnchorState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformRetrySchedulingDecisionEvaluationRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry scheduling decision evaluation recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor,
): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.evaluationAnchorId.trim().length > 0 &&
    anchor.platformRetrySchedulingDecisionEvaluationType.trim().length > 0 &&
    isDecisionAnchorState(anchor.evaluationAnchorState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Retry Scheduling Decision Evaluation anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes decision outcomes.
 */
export function assertRecoverableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor(
  value: DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor,
  index = 0,
): DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const evaluationAnchorId = requireNonEmptyString(
    value.evaluationAnchorId,
    `${prefix}.evaluationAnchorId`,
  );
  const platformRetrySchedulingDecisionEvaluationType = requireNonEmptyString(
    value.platformRetrySchedulingDecisionEvaluationType,
    `${prefix}.platformRetrySchedulingDecisionEvaluationType`,
  );

  if (
    value.schemaVersion !==
    NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_SCHEMA_VERSION
  ) {
    throw new NotificationPlatformRetrySchedulingDecisionEvaluationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision evaluation recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isDecisionAnchorState(value.evaluationAnchorState)) {
    throw new NotificationPlatformRetrySchedulingDecisionEvaluationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision evaluation recovery refused invalid evaluationAnchorState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    evaluationAnchorId,
    platformRetrySchedulingDecisionEvaluationType,
    evaluationAnchorState: value.evaluationAnchorState,
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
    throw new NotificationPlatformRetrySchedulingDecisionEvaluationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision evaluation recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then evaluationAnchorId. */
export function sortNotificationPlatformRetrySchedulingDecisionEvaluationAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.evaluationAnchorId.localeCompare(b.evaluationAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformRetrySchedulingDecisionEvaluationAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor(
      anchors[i]!,
      i,
    );
    const key = compositeKey(anchor.workspaceId, anchor.evaluationAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformRetrySchedulingDecisionEvaluationRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry scheduling decision evaluation recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformRetrySchedulingDecisionEvaluationAnchorsDeterministically(
    recovered,
  );
}

export function buildNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[],
): NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics {
  const ordered =
    sortNotificationPlatformRetrySchedulingDecisionEvaluationAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N26_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.evaluationAnchorId)),
    ),
  });
}
