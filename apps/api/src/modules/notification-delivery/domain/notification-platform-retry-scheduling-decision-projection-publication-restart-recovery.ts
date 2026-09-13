/**
 * W5-N28-c — Notification Platform Retry Scheduling Decision Projection Publication restart recovery foundation.
 *
 * W5-N28-b uses `buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState` for persisted-row
 * integrity only. Full restart recovery hydrate is implemented in W5-N28-c.
 * Restores decision projection publication description anchors only — does not perform runtime publication,
 * runtime decision projection, schedule, determine eligibility, calculate backoff, or execute retries.
 */

import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_STATES,
  type DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState,
} from './durable-notification-platform-retry-scheduling-decision-projection-publication-anchor';

export const W5_N28_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformRetrySchedulingDecisionProjectionPublicationRestartRecoveryError extends Error {
  readonly owner =
    W5_N28_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(
    code: NotificationPlatformRetrySchedulingDecisionProjectionPublicationRestartRecoveryError['code'],
    message: string,
  ) {
    super(message);
    this.name =
      'NotificationPlatformRetrySchedulingDecisionProjectionPublicationRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics =
  Readonly<{
    owner: typeof W5_N28_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_RECOVERY_OWNER;
    restoredCount: number;
    canonicalAnchorCount: number;
    workspaceIds: readonly string[];
    /** Deterministic recovery order (workspaceId ascending, then publicationAnchorId). */
    recoveryOrder: readonly string[];
  }>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, publicationAnchorId: string): string {
  return `${workspaceId}:${publicationAnchorId}`;
}

function isPublicationAnchorState(
  value: string,
): value is NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState {
  return (
    NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_STATES as readonly string[]
  ).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['publicationAnchorId', anchor.publicationAnchorId],
    [
      'platformRetrySchedulingDecisionProjectionPublicationType',
      anchor.platformRetrySchedulingDecisionProjectionPublicationType,
    ],
    ['publicationAnchorState', anchor.publicationAnchorState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry scheduling decision projection publication recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor,
): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.publicationAnchorId.trim().length > 0 &&
    anchor.platformRetrySchedulingDecisionProjectionPublicationType.trim().length > 0 &&
    isPublicationAnchorState(anchor.publicationAnchorState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Retry Scheduling Decision Projection Publication anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes publication outcomes.
 */
export function assertRecoverableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor(
  value: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor,
  index = 0,
): DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const publicationAnchorId = requireNonEmptyString(
    value.publicationAnchorId,
    `${prefix}.publicationAnchorId`,
  );
  const platformRetrySchedulingDecisionProjectionPublicationType = requireNonEmptyString(
    value.platformRetrySchedulingDecisionProjectionPublicationType,
    `${prefix}.platformRetrySchedulingDecisionProjectionPublicationType`,
  );

  if (
    value.schemaVersion !==
    NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_SCHEMA_VERSION
  ) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isPublicationAnchorState(value.publicationAnchorState)) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication recovery refused invalid publicationAnchorState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    publicationAnchorId,
    platformRetrySchedulingDecisionProjectionPublicationType,
    publicationAnchorState: value.publicationAnchorState,
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
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then publicationAnchorId. */
export function sortNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.publicationAnchorId.localeCompare(b.publicationAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[] =
    [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor =
      assertRecoverableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor(
        anchors[i]!,
        i,
      );
    const key = compositeKey(anchor.workspaceId, anchor.publicationAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry scheduling decision projection publication recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorsDeterministically(
    recovered,
  );
}

export function buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[],
): NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics {
  const ordered =
    sortNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorsDeterministically(
      anchors,
    );
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner:
      W5_N28_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.publicationAnchorId)),
    ),
  });
}
