/**
 * W5-N16-c — Notification Platform Metrics restart recovery foundation.
 *
 * W5-N16-b uses `buildNotificationPlatformMetricsAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N16-c.
 */

import {
  NOTIFICATION_PLATFORM_METRICS_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_METRICS_ANCHOR_STATES,
  type DurableNotificationPlatformMetricsAnchor,
  type NotificationPlatformMetricsAnchorState,
} from './durable-notification-platform-metrics-anchor';

export const W5_N16_C_NOTIFICATION_PLATFORM_METRICS_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformMetricsRestartRecoveryError extends Error {
  readonly owner = W5_N16_C_NOTIFICATION_PLATFORM_METRICS_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationPlatformMetricsRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationPlatformMetricsRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformMetricsRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N16_C_NOTIFICATION_PLATFORM_METRICS_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then metricsAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformMetricsRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform metrics recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformMetricsRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform metrics recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, metricsAnchorId: string): string {
  return `${workspaceId}:${metricsAnchorId}`;
}

function isMetricsState(value: string): value is NotificationPlatformMetricsAnchorState {
  return (NOTIFICATION_PLATFORM_METRICS_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformMetricsAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformMetricsRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform metrics recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformMetricsRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform metrics recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['metricsAnchorId', anchor.metricsAnchorId],
    ['platformMetricsType', anchor.platformMetricsType],
    ['metricsState', anchor.metricsState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformMetricsRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform metrics recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformMetricsAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.metricsAnchorId.trim().length > 0 &&
    anchor.platformMetricsType.trim().length > 0 &&
    isMetricsState(anchor.metricsState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Metrics anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes metrics outcomes.
 */
export function assertRecoverableNotificationPlatformMetricsAnchor(
  value: DurableNotificationPlatformMetricsAnchor,
  index = 0,
): DurableNotificationPlatformMetricsAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const metricsAnchorId = requireNonEmptyString(value.metricsAnchorId, `${prefix}.metricsAnchorId`);
  const platformMetricsType = requireNonEmptyString(
    value.platformMetricsType,
    `${prefix}.platformMetricsType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_METRICS_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformMetricsRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform metrics recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isMetricsState(value.metricsState)) {
    throw new NotificationPlatformMetricsRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform metrics recovery refused invalid metricsState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    metricsAnchorId,
    platformMetricsType,
    metricsState: value.metricsState,
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
    throw new NotificationPlatformMetricsRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform metrics recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then metricsAnchorId. */
export function sortNotificationPlatformMetricsAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformMetricsAnchor[],
): readonly DurableNotificationPlatformMetricsAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.metricsAnchorId.localeCompare(b.metricsAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformMetricsAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformMetricsAnchor[],
): readonly DurableNotificationPlatformMetricsAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformMetricsAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformMetricsAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.metricsAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformMetricsRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform metrics recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformMetricsAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformMetricsRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformMetricsAnchor[],
): NotificationPlatformMetricsRecoveryDiagnostics {
  const ordered = sortNotificationPlatformMetricsAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N16_C_NOTIFICATION_PLATFORM_METRICS_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.metricsAnchorId)),
    ),
  });
}
