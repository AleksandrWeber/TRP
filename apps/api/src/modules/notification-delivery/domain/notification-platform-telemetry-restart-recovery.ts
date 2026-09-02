/**
 * W5-N15-c — Notification Platform Telemetry restart recovery foundation.
 *
 * W5-N15-b uses `buildNotificationPlatformTelemetryAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N15-c.
 */

import {
  NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_STATES,
  type DurableNotificationPlatformTelemetryAnchor,
  type NotificationPlatformTelemetryAnchorState,
} from './durable-notification-platform-telemetry-anchor';

export const W5_N15_C_NOTIFICATION_PLATFORM_TELEMETRY_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformTelemetryRestartRecoveryError extends Error {
  readonly owner = W5_N15_C_NOTIFICATION_PLATFORM_TELEMETRY_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationPlatformTelemetryRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationPlatformTelemetryRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformTelemetryRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N15_C_NOTIFICATION_PLATFORM_TELEMETRY_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then telemetryAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformTelemetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform telemetry recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformTelemetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform telemetry recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, telemetryAnchorId: string): string {
  return `${workspaceId}:${telemetryAnchorId}`;
}

function isTelemetryState(value: string): value is NotificationPlatformTelemetryAnchorState {
  return (NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformTelemetryAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformTelemetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform telemetry recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformTelemetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform telemetry recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['telemetryAnchorId', anchor.telemetryAnchorId],
    ['platformTelemetryType', anchor.platformTelemetryType],
    ['telemetryState', anchor.telemetryState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformTelemetryRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform telemetry recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformTelemetryAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.telemetryAnchorId.trim().length > 0 &&
    anchor.platformTelemetryType.trim().length > 0 &&
    isTelemetryState(anchor.telemetryState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Telemetry anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes telemetry outcomes.
 */
export function assertRecoverableNotificationPlatformTelemetryAnchor(
  value: DurableNotificationPlatformTelemetryAnchor,
  index = 0,
): DurableNotificationPlatformTelemetryAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const telemetryAnchorId = requireNonEmptyString(
    value.telemetryAnchorId,
    `${prefix}.telemetryAnchorId`,
  );
  const platformTelemetryType = requireNonEmptyString(
    value.platformTelemetryType,
    `${prefix}.platformTelemetryType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformTelemetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform telemetry recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isTelemetryState(value.telemetryState)) {
    throw new NotificationPlatformTelemetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform telemetry recovery refused invalid telemetryState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    telemetryAnchorId,
    platformTelemetryType,
    telemetryState: value.telemetryState,
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
    throw new NotificationPlatformTelemetryRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform telemetry recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then telemetryAnchorId. */
export function sortNotificationPlatformTelemetryAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformTelemetryAnchor[],
): readonly DurableNotificationPlatformTelemetryAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.telemetryAnchorId.localeCompare(b.telemetryAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformTelemetryAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformTelemetryAnchor[],
): readonly DurableNotificationPlatformTelemetryAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformTelemetryAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformTelemetryAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.telemetryAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformTelemetryRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform telemetry recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformTelemetryAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformTelemetryRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformTelemetryAnchor[],
): NotificationPlatformTelemetryRecoveryDiagnostics {
  const ordered = sortNotificationPlatformTelemetryAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N15_C_NOTIFICATION_PLATFORM_TELEMETRY_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.telemetryAnchorId)),
    ),
  });
}
