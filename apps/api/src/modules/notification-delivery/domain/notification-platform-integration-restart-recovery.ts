/**
 * W5-N05-c — Notification Platform Integration restart recovery foundation.
 *
 * W5-N05-b uses `buildNotificationPlatformIntegrationAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N05-c.
 */

import {
  NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_SCHEMA_VERSION,
  NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_STATES,
  type DurableNotificationPlatformIntegrationAnchor,
  type NotificationPlatformIntegrationAnchorState,
} from './durable-notification-platform-integration-anchor';

export const W5_N05_C_NOTIFICATION_PLATFORM_INTEGRATION_RECOVERY_OWNER =
  'notification-delivery' as const;

export class NotificationPlatformIntegrationRestartRecoveryError extends Error {
  readonly owner = W5_N05_C_NOTIFICATION_PLATFORM_INTEGRATION_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: NotificationPlatformIntegrationRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'NotificationPlatformIntegrationRestartRecoveryError';
    this.code = code;
  }
}

export type NotificationPlatformIntegrationRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N05_C_NOTIFICATION_PLATFORM_INTEGRATION_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then integrationAnchorId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NotificationPlatformIntegrationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform integration recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NotificationPlatformIntegrationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform integration recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, integrationAnchorId: string): string {
  return `${workspaceId}:${integrationAnchorId}`;
}

function isIntegrationState(value: string): value is NotificationPlatformIntegrationAnchorState {
  return (NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableNotificationPlatformIntegrationAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new NotificationPlatformIntegrationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform integration recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new NotificationPlatformIntegrationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform integration recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['integrationAnchorId', anchor.integrationAnchorId],
    ['platformIntegrationType', anchor.platformIntegrationType],
    ['integrationState', anchor.integrationState],
    ['channelScope', anchor.channelScope],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new NotificationPlatformIntegrationRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform integration recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableNotificationPlatformIntegrationAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.integrationAnchorId.trim().length > 0 &&
    anchor.platformIntegrationType.trim().length > 0 &&
    isIntegrationState(anchor.integrationState)
  );
}

/**
 * Integrity gate for a single persisted Notification Platform Integration anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes integration outcomes.
 */
export function assertRecoverableNotificationPlatformIntegrationAnchor(
  value: DurableNotificationPlatformIntegrationAnchor,
  index = 0,
): DurableNotificationPlatformIntegrationAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const integrationAnchorId = requireNonEmptyString(
    value.integrationAnchorId,
    `${prefix}.integrationAnchorId`,
  );
  const platformIntegrationType = requireNonEmptyString(
    value.platformIntegrationType,
    `${prefix}.platformIntegrationType`,
  );

  if (value.schemaVersion !== NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_SCHEMA_VERSION) {
    throw new NotificationPlatformIntegrationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform integration recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isIntegrationState(value.integrationState)) {
    throw new NotificationPlatformIntegrationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform integration recovery refused invalid integrationState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    integrationAnchorId,
    platformIntegrationType,
    integrationState: value.integrationState,
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
    throw new NotificationPlatformIntegrationRestartRecoveryError(
      'CORRUPT_STATE',
      `Notification platform integration recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then integrationAnchorId. */
export function sortNotificationPlatformIntegrationAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformIntegrationAnchor[],
): readonly DurableNotificationPlatformIntegrationAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.integrationAnchorId.localeCompare(b.integrationAnchorId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareNotificationPlatformIntegrationAnchorsForRecovery(
  anchors: readonly DurableNotificationPlatformIntegrationAnchor[],
): readonly DurableNotificationPlatformIntegrationAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableNotificationPlatformIntegrationAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableNotificationPlatformIntegrationAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.integrationAnchorId);
    if (seen.has(key)) {
      throw new NotificationPlatformIntegrationRestartRecoveryError(
        'CORRUPT_STATE',
        `Notification platform integration recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortNotificationPlatformIntegrationAnchorsDeterministically(recovered);
}

export function buildNotificationPlatformIntegrationRecoveryDiagnostics(
  anchors: readonly DurableNotificationPlatformIntegrationAnchor[],
): NotificationPlatformIntegrationRecoveryDiagnostics {
  const ordered = sortNotificationPlatformIntegrationAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N05_C_NOTIFICATION_PLATFORM_INTEGRATION_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.integrationAnchorId)),
    ),
  });
}
