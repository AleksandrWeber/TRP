/**
 * W5-N12-c — Notification Platform Scheduler restart recovery foundation.
 *
 * W5-N12-b uses `buildNotificationPlatformSchedulerAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N12-c.
 */

import {
  NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_STATES,
  type DurableNotificationPlatformSchedulerAnchor,
  type NotificationPlatformSchedulerAnchorState,
} from './durable-notification-platform-scheduler-anchor';

export const W5_N12_C_NOTIFICATION_PLATFORM_SCHEDULER_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformSchedulerRestartRecoveryError extends Error {
  readonly owner = W5_N12_C_NOTIFICATION_PLATFORM_SCHEDULER_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationPlatformSchedulerRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationPlatformSchedulerRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformSchedulerRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N12_C_NOTIFICATION_PLATFORM_SCHEDULER_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then schedulerAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformSchedulerRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform scheduler recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformSchedulerRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform scheduler recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, schedulerAnchorId: string): string {
  return `${workspaceId}:${schedulerAnchorId}`;
}

function isSchedulerState(value: string): value is NotificationPlatformSchedulerAnchorState {
  return (NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformSchedulerAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformSchedulerRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform scheduler recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformSchedulerRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform scheduler recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['schedulerAnchorId', anchor.schedulerAnchorId],
    ['platformSchedulerType', anchor.platformSchedulerType],
    ['schedulerState', anchor.schedulerState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformSchedulerRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform scheduler recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformSchedulerAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.schedulerAnchorId.trim().length > 0 &&
    anchor.platformSchedulerType.trim().length > 0 &&
    isSchedulerState(anchor.schedulerState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Scheduler anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes scheduler outcomes.
 */
export function assertRecoverableNotificationPlatformSchedulerAnchor(
  value: DurableNotificationPlatformSchedulerAnchor,
  index = 0,
): DurableNotificationPlatformSchedulerAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const schedulerAnchorId = requireNonEmptyString(
    value.schedulerAnchorId,
    `${prefix}.schedulerAnchorId`,
  );
  const platformSchedulerType = requireNonEmptyString(
    value.platformSchedulerType,
    `${prefix}.platformSchedulerType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformSchedulerRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform scheduler recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isSchedulerState(value.schedulerState)) {
    throw new NotificationPlatformSchedulerRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform scheduler recovery refused invalid schedulerState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    schedulerAnchorId,
    platformSchedulerType,
    schedulerState: value.schedulerState,
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
    throw new NotificationPlatformSchedulerRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform scheduler recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then schedulerAnchorId. */
export function sortNotificationPlatformSchedulerAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformSchedulerAnchor[],
): readonly DurableNotificationPlatformSchedulerAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.schedulerAnchorId.localeCompare(b.schedulerAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformSchedulerAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformSchedulerAnchor[],
): readonly DurableNotificationPlatformSchedulerAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformSchedulerAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformSchedulerAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.schedulerAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformSchedulerRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform scheduler recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformSchedulerAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformSchedulerRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformSchedulerAnchor[],
): NotificationPlatformSchedulerRecoveryDiagnostics {
  const ordered = sortNotificationPlatformSchedulerAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N12_C_NOTIFICATION_PLATFORM_SCHEDULER_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.schedulerAnchorId)),
    ),
  });
}
