/**
 * W5-N10-c — Notification Platform Worker Execution restart recovery foundation.
 *
 * W5-N10-b uses `buildNotificationPlatformWorkerExecutionAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N10-c.
 */

import {
  NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_STATES,
  type DurableNotificationPlatformWorkerExecutionAnchor,
  type NotificationPlatformWorkerExecutionAnchorState,
} from './durable-notification-platform-worker-execution-anchor';

export const W5_N10_C_NOTIFICATION_PLATFORM_WORKER_EXECUTION_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformWorkerExecutionRestartRecoveryError extends Error {
  readonly owner = W5_N10_C_NOTIFICATION_PLATFORM_WORKER_EXECUTION_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(
    code: NotificationPlatformWorkerExecutionRestartRecoveryError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'NotificationPlatformWorkerExecutionRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformWorkerExecutionRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N10_C_NOTIFICATION_PLATFORM_WORKER_EXECUTION_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then workerExecutionAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformWorkerExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker execution recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformWorkerExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker execution recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, workerExecutionAnchorId: string): string {
  return `${workspaceId}:${workerExecutionAnchorId}`;
}

function isWorkerExecutionState(
  value: string,
): value is NotificationPlatformWorkerExecutionAnchorState {
  return (NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_STATES as readonly string[]).includes(
    value,
  );
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformWorkerExecutionAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformWorkerExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker execution recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformWorkerExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker execution recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['workerExecutionAnchorId', anchor.workerExecutionAnchorId],
    ['platformWorkerExecutionType', anchor.platformWorkerExecutionType],
    ['workerExecutionState', anchor.workerExecutionState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformWorkerExecutionRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform worker execution recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(
  anchor: DurableNotificationPlatformWorkerExecutionAnchor,
): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.workerExecutionAnchorId.trim().length > 0 &&
    anchor.platformWorkerExecutionType.trim().length > 0 &&
    isWorkerExecutionState(anchor.workerExecutionState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Worker Execution anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes worker outcomes.
 */
export function assertRecoverableNotificationPlatformWorkerExecutionAnchor(
  value: DurableNotificationPlatformWorkerExecutionAnchor,
  index = 0,
): DurableNotificationPlatformWorkerExecutionAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const workerExecutionAnchorId = requireNonEmptyString(
    value.workerExecutionAnchorId,
    `${prefix}.workerExecutionAnchorId`,
  );
  const platformWorkerExecutionType = requireNonEmptyString(
    value.platformWorkerExecutionType,
    `${prefix}.platformWorkerExecutionType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformWorkerExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker execution recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isWorkerExecutionState(value.workerExecutionState)) {
    throw new NotificationPlatformWorkerExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker execution recovery refused invalid workerExecutionState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    workerExecutionAnchorId,
    platformWorkerExecutionType,
    workerExecutionState: value.workerExecutionState,
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
    throw new NotificationPlatformWorkerExecutionRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker execution recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then workerExecutionAnchorId. */
export function sortNotificationPlatformWorkerExecutionAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformWorkerExecutionAnchor[],
): readonly DurableNotificationPlatformWorkerExecutionAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.workerExecutionAnchorId.localeCompare(b.workerExecutionAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformWorkerExecutionAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformWorkerExecutionAnchor[],
): readonly DurableNotificationPlatformWorkerExecutionAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformWorkerExecutionAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformWorkerExecutionAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.workerExecutionAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformWorkerExecutionRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform worker execution recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformWorkerExecutionAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformWorkerExecutionRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformWorkerExecutionAnchor[],
): NotificationPlatformWorkerExecutionRecoveryDiagnostics {
  const ordered = sortNotificationPlatformWorkerExecutionAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N10_C_NOTIFICATION_PLATFORM_WORKER_EXECUTION_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.workerExecutionAnchorId)),
    ),
  });
}
