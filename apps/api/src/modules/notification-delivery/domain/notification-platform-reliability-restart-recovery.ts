/**
 * W5-N17-c — Notification Platform Delivery Reliability restart recovery foundation.
 *
 * W5-N17-b uses `buildNotificationPlatformReliabilityAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N17-c.
 */

import {
  NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_STATES,
  type DurableNotificationPlatformReliabilityAnchor,
  type NotificationPlatformReliabilityAnchorState,
} from './durable-notification-platform-reliability-anchor';

export const W5_N17_C_NOTIFICATION_PLATFORM_RELIABILITY_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformReliabilityRestartRecoveryError extends Error {
  readonly owner = W5_N17_C_NOTIFICATION_PLATFORM_RELIABILITY_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationPlatformReliabilityRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationPlatformReliabilityRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformReliabilityRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N17_C_NOTIFICATION_PLATFORM_RELIABILITY_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then reliabilityAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformReliabilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery reliability recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformReliabilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery reliability recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, reliabilityAnchorId: string): string {
  return `${workspaceId}:${reliabilityAnchorId}`;
}

function isReliabilityState(value: string): value is NotificationPlatformReliabilityAnchorState {
  return (NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformReliabilityAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformReliabilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery reliability recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformReliabilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery reliability recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['reliabilityAnchorId', anchor.reliabilityAnchorId],
    ['platformReliabilityType', anchor.platformReliabilityType],
    ['reliabilityState', anchor.reliabilityState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformReliabilityRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform delivery reliability recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformReliabilityAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.reliabilityAnchorId.trim().length > 0 &&
    anchor.platformReliabilityType.trim().length > 0 &&
    isReliabilityState(anchor.reliabilityState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Delivery Reliability anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes delivery outcomes.
 */
export function assertRecoverableNotificationPlatformReliabilityAnchor(
  value: DurableNotificationPlatformReliabilityAnchor,
  index = 0,
): DurableNotificationPlatformReliabilityAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const reliabilityAnchorId = requireNonEmptyString(
    value.reliabilityAnchorId,
    `${prefix}.reliabilityAnchorId`,
  );
  const platformReliabilityType = requireNonEmptyString(
    value.platformReliabilityType,
    `${prefix}.platformReliabilityType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformReliabilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery reliability recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isReliabilityState(value.reliabilityState)) {
    throw new NotificationPlatformReliabilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery reliability recovery refused invalid reliabilityState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    reliabilityAnchorId,
    platformReliabilityType,
    reliabilityState: value.reliabilityState,
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
    throw new NotificationPlatformReliabilityRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform delivery reliability recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then reliabilityAnchorId. */
export function sortNotificationPlatformReliabilityAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformReliabilityAnchor[],
): readonly DurableNotificationPlatformReliabilityAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.reliabilityAnchorId.localeCompare(b.reliabilityAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformReliabilityAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformReliabilityAnchor[],
): readonly DurableNotificationPlatformReliabilityAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformReliabilityAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformReliabilityAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.reliabilityAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformReliabilityRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform delivery reliability recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformReliabilityAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformReliabilityRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformReliabilityAnchor[],
): NotificationPlatformReliabilityRecoveryDiagnostics {
  const ordered = sortNotificationPlatformReliabilityAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N17_C_NOTIFICATION_PLATFORM_RELIABILITY_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.reliabilityAnchorId)),
    ),
  });
}
