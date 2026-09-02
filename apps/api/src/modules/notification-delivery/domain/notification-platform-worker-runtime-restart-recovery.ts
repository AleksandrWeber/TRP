/**
 * W5-N11-c — Notification Platform Worker Runtime restart recovery foundation.
 *
 * W5-N11-b uses `buildNotificationPlatformWorkerRuntimeAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N11-c.
 */

import {
  NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_STATES,
  type DurableNotificationPlatformWorkerRuntimeAnchor,
  type NotificationPlatformWorkerRuntimeAnchorState,
} from './durable-notification-platform-worker-runtime-anchor';

export const W5_N11_C_NOTIFICATION_PLATFORM_WORKER_RUNTIME_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformWorkerRuntimeRestartRecoveryError extends Error {
  readonly owner = W5_N11_C_NOTIFICATION_PLATFORM_WORKER_RUNTIME_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(
    code: NotificationPlatformWorkerRuntimeRestartRecoveryError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'NotificationPlatformWorkerRuntimeRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformWorkerRuntimeRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N11_C_NOTIFICATION_PLATFORM_WORKER_RUNTIME_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then workerRuntimeAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformWorkerRuntimeRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker runtime recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformWorkerRuntimeRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker runtime recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, workerRuntimeAnchorId: string): string {
  return `${workspaceId}:${workerRuntimeAnchorId}`;
}

function isWorkerExecutionState(
  value: string,
): value is NotificationPlatformWorkerRuntimeAnchorState {
  return (NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformWorkerRuntimeAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformWorkerRuntimeRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker runtime recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformWorkerRuntimeRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker runtime recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['workerRuntimeAnchorId', anchor.workerRuntimeAnchorId],
    ['platformWorkerRuntimeType', anchor.platformWorkerRuntimeType],
    ['workerRuntimeState', anchor.workerRuntimeState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformWorkerRuntimeRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform worker runtime recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformWorkerRuntimeAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.workerRuntimeAnchorId.trim().length > 0 &&
    anchor.platformWorkerRuntimeType.trim().length > 0 &&
    isWorkerExecutionState(anchor.workerRuntimeState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Worker Runtime anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes worker outcomes.
 */
export function assertRecoverableNotificationPlatformWorkerRuntimeAnchor(
  value: DurableNotificationPlatformWorkerRuntimeAnchor,
  index = 0,
): DurableNotificationPlatformWorkerRuntimeAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const workerRuntimeAnchorId = requireNonEmptyString(
    value.workerRuntimeAnchorId,
    `${prefix}.workerRuntimeAnchorId`,
  );
  const platformWorkerRuntimeType = requireNonEmptyString(
    value.platformWorkerRuntimeType,
    `${prefix}.platformWorkerRuntimeType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformWorkerRuntimeRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker runtime recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isWorkerExecutionState(value.workerRuntimeState)) {
    throw new NotificationPlatformWorkerRuntimeRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker runtime recovery refused invalid workerRuntimeState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    workerRuntimeAnchorId,
    platformWorkerRuntimeType,
    workerRuntimeState: value.workerRuntimeState,
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
    throw new NotificationPlatformWorkerRuntimeRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform worker runtime recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then workerRuntimeAnchorId. */
export function sortNotificationPlatformWorkerRuntimeAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformWorkerRuntimeAnchor[],
): readonly DurableNotificationPlatformWorkerRuntimeAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.workerRuntimeAnchorId.localeCompare(b.workerRuntimeAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformWorkerRuntimeAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformWorkerRuntimeAnchor[],
): readonly DurableNotificationPlatformWorkerRuntimeAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformWorkerRuntimeAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformWorkerRuntimeAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.workerRuntimeAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformWorkerRuntimeRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform worker runtime recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformWorkerRuntimeAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformWorkerRuntimeAnchor[],
): NotificationPlatformWorkerRuntimeRecoveryDiagnostics {
  const ordered = sortNotificationPlatformWorkerRuntimeAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N11_C_NOTIFICATION_PLATFORM_WORKER_RUNTIME_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.workerRuntimeAnchorId)),
    ),
  });
}
