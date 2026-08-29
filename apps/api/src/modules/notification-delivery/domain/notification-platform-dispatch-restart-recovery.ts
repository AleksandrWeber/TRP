/**
 * W5-N07-c — Notification Platform Dispatch restart recovery foundation.
 *
 * W5-N07-b uses `buildNotificationPlatformDispatchAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N07-c.
 */

import {
  NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_STATES,
  type DurableNotificationPlatformDispatchAnchor,
  type NotificationPlatformDispatchAnchorState,
} from './durable-notification-platform-dispatch-anchor';

export const W5_N07_C_NOTIFICATION_PLATFORM_DISPATCH_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformDispatchRestartRecoveryError extends Error {
  readonly owner = W5_N07_C_NOTIFICATION_PLATFORM_DISPATCH_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationPlatformDispatchRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationPlatformDispatchRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformDispatchRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N07_C_NOTIFICATION_PLATFORM_DISPATCH_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then dispatchAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformDispatchRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dispatch recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformDispatchRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dispatch recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, dispatchAnchorId: string): string {
  return `${workspaceId}:${dispatchAnchorId}`;
}

function isDispatchState(value: string): value is NotificationPlatformDispatchAnchorState {
  return (NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformDispatchAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformDispatchRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dispatch recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformDispatchRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dispatch recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['dispatchAnchorId', anchor.dispatchAnchorId],
    ['platformDispatchType', anchor.platformDispatchType],
    ['dispatchState', anchor.dispatchState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformDispatchRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform dispatch recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformDispatchAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.dispatchAnchorId.trim().length > 0 &&
    anchor.platformDispatchType.trim().length > 0 &&
    isDispatchState(anchor.dispatchState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Dispatch anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes dispatch outcomes.
 */
export function assertRecoverableNotificationPlatformDispatchAnchor(
  value: DurableNotificationPlatformDispatchAnchor,
  index = 0,
): DurableNotificationPlatformDispatchAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const dispatchAnchorId = requireNonEmptyString(
    value.dispatchAnchorId,
    `${prefix}.dispatchAnchorId`,
  );
  const platformDispatchType = requireNonEmptyString(
    value.platformDispatchType,
    `${prefix}.platformDispatchType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformDispatchRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dispatch recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isDispatchState(value.dispatchState)) {
    throw new NotificationPlatformDispatchRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dispatch recovery refused invalid dispatchState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    dispatchAnchorId,
    platformDispatchType,
    dispatchState: value.dispatchState,
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
    throw new NotificationPlatformDispatchRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform dispatch recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then dispatchAnchorId. */
export function sortNotificationPlatformDispatchAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformDispatchAnchor[],
): readonly DurableNotificationPlatformDispatchAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.dispatchAnchorId.localeCompare(b.dispatchAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformDispatchAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformDispatchAnchor[],
): readonly DurableNotificationPlatformDispatchAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformDispatchAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformDispatchAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.dispatchAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformDispatchRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform dispatch recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformDispatchAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformDispatchRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformDispatchAnchor[],
): NotificationPlatformDispatchRecoveryDiagnostics {
  const ordered = sortNotificationPlatformDispatchAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N07_C_NOTIFICATION_PLATFORM_DISPATCH_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.dispatchAnchorId)),
    ),
  });
}
