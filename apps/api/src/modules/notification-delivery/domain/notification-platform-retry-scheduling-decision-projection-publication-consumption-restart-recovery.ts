/**
 * W5-N29-c — Notification Platform Retry Scheduling Decision Projection Publication Consumption restart recovery foundation.
 *
 * W5-N29-b uses `buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState` for persisted-row
 * integrity only. Full restart recovery hydrate is implemented in W5-N29-c.
 * Restores decision projection publication consumption description anchors only — does not perform runtime consumption, runtime publication,
 * runtime decision projection, schedule, determine eligibility, calculate backoff, or execute retries.
 */

import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_STATES,
  type DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState,
} from './durable-notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor';

export const W5_N29_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRestartRecoveryError extends Error {
  readonly owner =
    W5_N29_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(
    code: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRestartRecoveryError['code'],
    message: string,
  ) {
    super(message);
    this.name =
      'NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics =
  Readonly<{
    owner: typeof W5_N29_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_RECOVERY_OWNER;
    restoredCount: number;
    canonicalAnchorCount: number;
    workspaceIds: readonly string[];
    /** Deterministic recovery order (workspaceId ascending, then consumptionAnchorId). */
    recoveryOrder: readonly string[];
  }>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication consumption recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication consumption recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, consumptionAnchorId: string): string {
  return `${workspaceId}:${consumptionAnchorId}`;
}

function isConsumptionAnchorState(
  value: string,
): value is NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState {
  return (
    NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_STATES as readonly string[]
  ).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication consumption recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication consumption recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['consumptionAnchorId', anchor.consumptionAnchorId],
    [
      'platformRetrySchedulingDecisionProjectionPublicationConsumptionType',
      anchor.platformRetrySchedulingDecisionProjectionPublicationConsumptionType,
    ],
    ['consumptionAnchorState', anchor.consumptionAnchorState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry scheduling decision projection publication consumption recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor,
): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.consumptionAnchorId.trim().length > 0 &&
    anchor.platformRetrySchedulingDecisionProjectionPublicationConsumptionType.trim().length > 0 &&
    isConsumptionAnchorState(anchor.consumptionAnchorState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Retry Scheduling Decision Projection Publication anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes consumption outcomes.
 */
export function assertRecoverableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
  value: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor,
  index = 0,
): DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const consumptionAnchorId = requireNonEmptyString(
    value.consumptionAnchorId,
    `${prefix}.consumptionAnchorId`,
  );
  const platformRetrySchedulingDecisionProjectionPublicationConsumptionType = requireNonEmptyString(
    value.platformRetrySchedulingDecisionProjectionPublicationConsumptionType,
    `${prefix}.platformRetrySchedulingDecisionProjectionPublicationConsumptionType`,
  );

  if (
    value.schemaVersion !==
    NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_SCHEMA_VERSION
  ) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication consumption recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isConsumptionAnchorState(value.consumptionAnchorState)) {
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication consumption recovery refused invalid consumptionAnchorState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    consumptionAnchorId,
    platformRetrySchedulingDecisionProjectionPublicationConsumptionType,
    consumptionAnchorState: value.consumptionAnchorState,
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
    throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry scheduling decision projection publication consumption recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then consumptionAnchorId. */
export function sortNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.consumptionAnchorId.localeCompare(b.consumptionAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[],
): readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[] =
    [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor =
      assertRecoverableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
        anchors[i]!,
        i,
      );
    const key = compositeKey(anchor.workspaceId, anchor.consumptionAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry scheduling decision projection publication consumption recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorsDeterministically(
    recovered,
  );
}

export function buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[],
): NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics {
  const ordered =
    sortNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorsDeterministically(
      anchors,
    );
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner:
      W5_N29_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.consumptionAnchorId)),
    ),
  });
}
