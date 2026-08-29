/**
 * W5-N09-c — Notification Platform Workers restart recovery foundation.
 *
 * W5-N09-b uses `buildNotificationPlatformWorkersAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N09-c.
 */

import {
  NOTIFICATION_PLATFORM_WORKERS_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_WORKERS_ANCHOR_STATES,
  type DurableNotificationPlatformWorkersAnchor,
  type NotificationPlatformWorkersAnchorState,
} from './durable-notification-platform-workers-anchor';

export const W5_N09_C_NOTIFICATION_PLATFORM_WORKERS_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformWorkersRestartRecoveryError extends Error {
  readonly owner = W5_N09_C_NOTIFICATION_PLATFORM_WORKERS_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationPlatformWorkersRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationPlatformWorkersRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformWorkersRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N09_C_NOTIFICATION_PLATFORM_WORKERS_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then workersAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformWorkersRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform workers recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformWorkersRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform workers recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, workersAnchorId: string): string {
  return `${workspaceId}:${workersAnchorId}`;
}

function isWorkersState(value: string): value is NotificationPlatformWorkersAnchorState {
  return (NOTIFICATION_PLATFORM_WORKERS_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformWorkersAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformWorkersRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform workers recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformWorkersRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform workers recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['workersAnchorId', anchor.workersAnchorId],
    ['platformWorkerType', anchor.platformWorkerType],
    ['workersState', anchor.workersState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformWorkersRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform workers recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformWorkersAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.workersAnchorId.trim().length > 0 &&
    anchor.platformWorkerType.trim().length > 0 &&
    isWorkersState(anchor.workersState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Workers anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes worker outcomes.
 */
export function assertRecoverableNotificationPlatformWorkersAnchor(
  value: DurableNotificationPlatformWorkersAnchor,
  index = 0,
): DurableNotificationPlatformWorkersAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const workersAnchorId = requireNonEmptyString(value.workersAnchorId, `${prefix}.workersAnchorId`);
  const platformWorkerType = requireNonEmptyString(
    value.platformWorkerType,
    `${prefix}.platformWorkerType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_WORKERS_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformWorkersRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform workers recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isWorkersState(value.workersState)) {
    throw new NotificationPlatformWorkersRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform workers recovery refused invalid workersState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    workersAnchorId,
    platformWorkerType,
    workersState: value.workersState,
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
    throw new NotificationPlatformWorkersRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform workers recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then workersAnchorId. */
export function sortNotificationPlatformWorkersAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformWorkersAnchor[],
): readonly DurableNotificationPlatformWorkersAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.workersAnchorId.localeCompare(b.workersAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformWorkersAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformWorkersAnchor[],
): readonly DurableNotificationPlatformWorkersAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformWorkersAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformWorkersAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.workersAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformWorkersRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform workers recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformWorkersAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformWorkersRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformWorkersAnchor[],
): NotificationPlatformWorkersRecoveryDiagnostics {
  const ordered = sortNotificationPlatformWorkersAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N09_C_NOTIFICATION_PLATFORM_WORKERS_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.workersAnchorId)),
    ),
  });
}
