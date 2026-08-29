/**
 * W5-N08-c — Notification Platform Queue restart recovery foundation.
 *
 * W5-N08-b uses `buildNotificationPlatformQueueAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N08-c.
 */

import {
  NOTIFICATION_PLATFORM_QUEUE_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_QUEUE_ANCHOR_STATES,
  type DurableNotificationPlatformQueueAnchor,
  type NotificationPlatformQueueAnchorState,
} from './durable-notification-platform-queue-anchor';

export const W5_N08_C_NOTIFICATION_PLATFORM_QUEUE_RECOVERY_OWNER = 'notification-delivery' as const;

export class NotificationPlatformQueueRestartRecoveryError extends Error {
  readonly owner = W5_N08_C_NOTIFICATION_PLATFORM_QUEUE_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationPlatformQueueRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationPlatformQueueRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformQueueRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N08_C_NOTIFICATION_PLATFORM_QUEUE_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then queueAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformQueueRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform queue recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformQueueRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform queue recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, queueAnchorId: string): string {
  return `${workspaceId}:${queueAnchorId}`;
}

function isQueueState(value: string): value is NotificationPlatformQueueAnchorState {
  return (NOTIFICATION_PLATFORM_QUEUE_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformQueueAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformQueueRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform queue recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformQueueRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform queue recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['queueAnchorId', anchor.queueAnchorId],
    ['platformQueueType', anchor.platformQueueType],
    ['queueState', anchor.queueState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformQueueRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform queue recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformQueueAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.queueAnchorId.trim().length > 0 &&
    anchor.platformQueueType.trim().length > 0 &&
    isQueueState(anchor.queueState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Queue anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes queue outcomes.
 */
export function assertRecoverableNotificationPlatformQueueAnchor(
  value: DurableNotificationPlatformQueueAnchor,
  index = 0,
): DurableNotificationPlatformQueueAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const queueAnchorId = requireNonEmptyString(value.queueAnchorId, `${prefix}.queueAnchorId`);
  const platformQueueType = requireNonEmptyString(
    value.platformQueueType,
    `${prefix}.platformQueueType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_QUEUE_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformQueueRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform queue recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isQueueState(value.queueState)) {
    throw new NotificationPlatformQueueRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform queue recovery refused invalid queueState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    queueAnchorId,
    platformQueueType,
    queueState: value.queueState,
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
    throw new NotificationPlatformQueueRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform queue recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then queueAnchorId. */
export function sortNotificationPlatformQueueAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformQueueAnchor[],
): readonly DurableNotificationPlatformQueueAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.queueAnchorId.localeCompare(b.queueAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformQueueAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformQueueAnchor[],
): readonly DurableNotificationPlatformQueueAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformQueueAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformQueueAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.queueAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformQueueRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform queue recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformQueueAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformQueueRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformQueueAnchor[],
): NotificationPlatformQueueRecoveryDiagnostics {
  const ordered = sortNotificationPlatformQueueAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N08_C_NOTIFICATION_PLATFORM_QUEUE_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.queueAnchorId)),
    ),
  });
}
