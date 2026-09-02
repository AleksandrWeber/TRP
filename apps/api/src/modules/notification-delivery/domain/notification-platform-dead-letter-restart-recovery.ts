/**
 * W5-N14-c — Notification Platform Dead Letter restart recovery foundation.
 *
 * W5-N14-b uses `buildNotificationPlatformDeadLetterAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N14-c.
 */

import {
  NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_STATES,
  type DurableNotificationPlatformDeadLetterAnchor,
  type NotificationPlatformDeadLetterAnchorState,
} from './durable-notification-platform-dead-letter-anchor';

export const W5_N14_C_NOTIFICATION_PLATFORM_DEAD_LETTER_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformDeadLetterRestartRecoveryError extends Error {
  readonly owner = W5_N14_C_NOTIFICATION_PLATFORM_DEAD_LETTER_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationPlatformDeadLetterRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationPlatformDeadLetterRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformDeadLetterRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N14_C_NOTIFICATION_PLATFORM_DEAD_LETTER_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then deadLetterAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformDeadLetterRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dead-letter recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformDeadLetterRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dead-letter recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, deadLetterAnchorId: string): string {
  return `${workspaceId}:${deadLetterAnchorId}`;
}

function isDeadLetterState(value: string): value is NotificationPlatformDeadLetterAnchorState {
  return (NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformDeadLetterAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformDeadLetterRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dead-letter recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformDeadLetterRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dead-letter recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['deadLetterAnchorId', anchor.deadLetterAnchorId],
    ['platformDeadLetterType', anchor.platformDeadLetterType],
    ['deadLetterState', anchor.deadLetterState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformDeadLetterRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform dead-letter recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformDeadLetterAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.deadLetterAnchorId.trim().length > 0 &&
    anchor.platformDeadLetterType.trim().length > 0 &&
    isDeadLetterState(anchor.deadLetterState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Dead Letter anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes dead-letter outcomes.
 */
export function assertRecoverableNotificationPlatformDeadLetterAnchor(
  value: DurableNotificationPlatformDeadLetterAnchor,
  index = 0,
): DurableNotificationPlatformDeadLetterAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const deadLetterAnchorId = requireNonEmptyString(
    value.deadLetterAnchorId,
    `${prefix}.deadLetterAnchorId`,
  );
  const platformDeadLetterType = requireNonEmptyString(
    value.platformDeadLetterType,
    `${prefix}.platformDeadLetterType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformDeadLetterRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dead-letter recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isDeadLetterState(value.deadLetterState)) {
    throw new NotificationPlatformDeadLetterRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dead-letter recovery refused invalid deadLetterState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    deadLetterAnchorId,
    platformDeadLetterType,
    deadLetterState: value.deadLetterState,
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
    throw new NotificationPlatformDeadLetterRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dead-letter recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then deadLetterAnchorId. */
export function sortNotificationPlatformDeadLetterAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformDeadLetterAnchor[],
): readonly DurableNotificationPlatformDeadLetterAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.deadLetterAnchorId.localeCompare(b.deadLetterAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformDeadLetterAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformDeadLetterAnchor[],
): readonly DurableNotificationPlatformDeadLetterAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformDeadLetterAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformDeadLetterAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.deadLetterAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformDeadLetterRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform dead-letter recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformDeadLetterAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformDeadLetterRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformDeadLetterAnchor[],
): NotificationPlatformDeadLetterRecoveryDiagnostics {
  const ordered = sortNotificationPlatformDeadLetterAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N14_C_NOTIFICATION_PLATFORM_DEAD_LETTER_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.deadLetterAnchorId)),
    ),
  });
}
