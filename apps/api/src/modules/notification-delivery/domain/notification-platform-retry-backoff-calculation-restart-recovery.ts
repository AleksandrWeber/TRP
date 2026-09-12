/**
 * W5-N22-c — Notification Platform Retry Backoff Calculation restart recovery foundation.
 *
 * W5-N22-b uses `buildNotificationPlatformRetryBackoffCalculationAnchorState` for persisted-row
 * integrity only. Full restart recovery hydrate is implemented in W5-N22-c.
 * Restores calculation description anchors only — does not calculate, schedule, or execute retries.
 */

import {
  NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_STATES,
  type DurableNotificationPlatformRetryBackoffCalculationAnchor,
  type NotificationPlatformRetryBackoffCalculationAnchorState,
} from './durable-notification-platform-retry-backoff-calculation-anchor';

export const W5_N22_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformRetryBackoffCalculationRestartRecoveryError extends Error {
  readonly owner = W5_N22_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(
    code: NotificationPlatformRetryBackoffCalculationRestartRecoveryError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'NotificationPlatformRetryBackoffCalculationRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformRetryBackoffCalculationRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N22_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then calculationAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformRetryBackoffCalculationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff calculation recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformRetryBackoffCalculationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff calculation recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, calculationAnchorId: string): string {
  return `${workspaceId}:${calculationAnchorId}`;
}

function isCalculationAnchorState(
  value: string,
): value is NotificationPlatformRetryBackoffCalculationAnchorState {
  return (
    NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_STATES as readonly string[]
  ).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformRetryBackoffCalculationAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformRetryBackoffCalculationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff calculation recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformRetryBackoffCalculationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff calculation recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['calculationAnchorId', anchor.calculationAnchorId],
    ['platformBackoffCalculationType', anchor.platformBackoffCalculationType],
    ['calculationAnchorState', anchor.calculationAnchorState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformRetryBackoffCalculationRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry backoff calculation recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(
  anchor: DurableNotificationPlatformRetryBackoffCalculationAnchor,
): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.calculationAnchorId.trim().length > 0 &&
    anchor.platformBackoffCalculationType.trim().length > 0 &&
    isCalculationAnchorState(anchor.calculationAnchorState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Retry Backoff Calculation anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes calculation outcomes.
 */
export function assertRecoverableNotificationPlatformRetryBackoffCalculationAnchor(
  value: DurableNotificationPlatformRetryBackoffCalculationAnchor,
  index = 0,
): DurableNotificationPlatformRetryBackoffCalculationAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const calculationAnchorId = requireNonEmptyString(
    value.calculationAnchorId,
    `${prefix}.calculationAnchorId`,
  );
  const platformBackoffCalculationType = requireNonEmptyString(
    value.platformBackoffCalculationType,
    `${prefix}.platformBackoffCalculationType`,
  );

  if (
    value.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_SCHEMA_VERSION
  ) {
    throw new NotificationPlatformRetryBackoffCalculationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff calculation recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isCalculationAnchorState(value.calculationAnchorState)) {
    throw new NotificationPlatformRetryBackoffCalculationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff calculation recovery refused invalid calculationAnchorState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    calculationAnchorId,
    platformBackoffCalculationType,
    calculationAnchorState: value.calculationAnchorState,
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
    throw new NotificationPlatformRetryBackoffCalculationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform retry backoff calculation recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then calculationAnchorId. */
export function sortNotificationPlatformRetryBackoffCalculationAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetryBackoffCalculationAnchor[],
): readonly DurableNotificationPlatformRetryBackoffCalculationAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.calculationAnchorId.localeCompare(b.calculationAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformRetryBackoffCalculationAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformRetryBackoffCalculationAnchor[],
): readonly DurableNotificationPlatformRetryBackoffCalculationAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformRetryBackoffCalculationAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformRetryBackoffCalculationAnchor(
      anchors[i]!,
      i,
    );
    const key = compositeKey(anchor.workspaceId, anchor.calculationAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformRetryBackoffCalculationRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform retry backoff calculation recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformRetryBackoffCalculationAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformRetryBackoffCalculationRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformRetryBackoffCalculationAnchor[],
): NotificationPlatformRetryBackoffCalculationRecoveryDiagnostics {
  const ordered = sortNotificationPlatformRetryBackoffCalculationAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N22_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.calculationAnchorId)),
    ),
  });
}
