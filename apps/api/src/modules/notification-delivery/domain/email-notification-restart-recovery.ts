/**
 * W5-N02-c — Email Notification restart recovery foundation.
 *
 * W5-N02-b uses `buildEmailNotificationAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N02-c.
 */

import {
  EMAIL_NOTIFICATION_ANCHOR_DELIVERY_STATES,
  EMAIL_NOTIFICATION_ANCHOR_SCHEMA_VERSION,
  type DurableEmailNotificationAnchor,
  type EmailNotificationAnchorDeliveryState,
} from './durable-email-notification-anchor';

export const W5_N02_C_EMAIL_NOTIFICATION_RECOVERY_OWNER = 'notification-delivery' as const;

export class EmailNotificationRestartRecoveryError extends Error {
  readonly owner = W5_N02_C_EMAIL_NOTIFICATION_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: EmailNotificationRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'EmailNotificationRestartRecoveryError';
    this.code = code;
  }
}

export type EmailNotificationRecoveryDiagnostics = Readonly<{
  owner: typeof W5_N02_C_EMAIL_NOTIFICATION_RECOVERY_OWNER;
  restoredCount: number;
  canonicalAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then notificationId). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new EmailNotificationRestartRecoveryError(
      'CORRUPT_STATE',
      `Email notification recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new EmailNotificationRestartRecoveryError(
      'CORRUPT_STATE',
      `Email notification recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, notificationId: string): string {
  return `${workspaceId}:${notificationId}`;
}

function isDeliveryState(value: string): value is EmailNotificationAnchorDeliveryState {
  return (EMAIL_NOTIFICATION_ANCHOR_DELIVERY_STATES as readonly string[]).includes(value);
}

function assertIntegrityMetadataMatchesAnchor(
  anchor: DurableEmailNotificationAnchor,
  prefix: string,
): void {
  const raw = anchor.integrityMetadata;
  if (raw === null || raw.trim().length === 0) {
    throw new EmailNotificationRestartRecoveryError(
      'CORRUPT_STATE',
      `Email notification recovery refused missing integrityMetadata at ${prefix}`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new EmailNotificationRestartRecoveryError(
      'CORRUPT_STATE',
      `Email notification recovery refused invalid integrityMetadata JSON at ${prefix}`,
    );
  }

  const expectedPairs: readonly [string, unknown][] = Object.freeze([
    ['workspaceId', anchor.workspaceId],
    ['notificationId', anchor.notificationId],
    ['notificationChannel', anchor.notificationChannel],
    ['notificationType', anchor.notificationType],
    ['recipientIdentifier', anchor.recipientIdentifier],
    ['templateIdentifier', anchor.templateIdentifier],
    ['deliveryState', anchor.deliveryState],
  ]);

  for (const [field, expected] of expectedPairs) {
    if (parsed[field] !== expected) {
      throw new EmailNotificationRestartRecoveryError(
        'CORRUPT_STATE',
        `Email notification recovery refused integrityMetadata mismatch at ${prefix}.${field}`,
      );
    }
  }
}

function hasCanonicalAnchorFields(anchor: DurableEmailNotificationAnchor): boolean {
  return (
    anchor.workspaceId.trim().length > 0 &&
    anchor.notificationId.trim().length > 0 &&
    anchor.notificationChannel.trim().length > 0 &&
    anchor.notificationType.trim().length > 0 &&
    anchor.notificationChannel === 'email' &&
    isDeliveryState(anchor.deliveryState)
  );
}

/**
 * Integrity gate for a single persisted Email notification anchor row.
 * Never fabricates defaults for missing required fields. Never synthesizes delivery outcomes.
 */
export function assertRecoverableEmailNotificationAnchor(
  value: DurableEmailNotificationAnchor,
  index = 0,
): DurableEmailNotificationAnchor {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const notificationId = requireNonEmptyString(value.notificationId, `${prefix}.notificationId`);
  const notificationChannel = requireNonEmptyString(
    value.notificationChannel,
    `${prefix}.notificationChannel`,
  ).toLowerCase();
  const notificationType = requireNonEmptyString(
    value.notificationType,
    `${prefix}.notificationType`,
  );

  if (notificationChannel !== 'email') {
    throw new EmailNotificationRestartRecoveryError(
      'CORRUPT_STATE',
      `Email notification recovery refused invalid notificationChannel at ${prefix}`,
    );
  }

  if (value.schemaVersion !== EMAIL_NOTIFICATION_ANCHOR_SCHEMA_VERSION) {
    throw new EmailNotificationRestartRecoveryError(
      'CORRUPT_STATE',
      `Email notification recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (!isDeliveryState(value.deliveryState)) {
    throw new EmailNotificationRestartRecoveryError(
      'CORRUPT_STATE',
      `Email notification recovery refused invalid deliveryState at ${prefix}`,
    );
  }

  assertIso(value.recordedAt, `${prefix}.recordedAt`);
  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  const anchor = Object.freeze({
    workspaceId,
    notificationId,
    notificationChannel,
    notificationType,
    recipientIdentifier: value.recipientIdentifier,
    templateIdentifier: value.templateIdentifier,
    deliveryState: value.deliveryState,
    integrityMetadata: value.integrityMetadata,
    correlationId: value.correlationId,
    schemaVersion: value.schemaVersion,
    recordedAt: value.recordedAt,
    recordedByActorId: value.recordedByActorId,
    updatedAt: value.updatedAt,
  });

  assertIntegrityMetadataMatchesAnchor(anchor, prefix);

  if (!hasCanonicalAnchorFields(anchor)) {
    throw new EmailNotificationRestartRecoveryError(
      'CORRUPT_STATE',
      `Email notification recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return anchor;
}

/** Deterministic recovery order: workspaceId ascending, then notificationId. */
export function sortEmailNotificationAnchorsDeterministically(
  anchors: readonly DurableEmailNotificationAnchor[],
): readonly DurableEmailNotificationAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.notificationId.localeCompare(b.notificationId);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareEmailNotificationAnchorsForRecovery(
  anchors: readonly DurableEmailNotificationAnchor[],
): readonly DurableEmailNotificationAnchor[] {
  const seen = new Set<string>();
  const recovered: DurableEmailNotificationAnchor[] = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = assertRecoverableEmailNotificationAnchor(anchors[i]!, i);
    const key = compositeKey(anchor.workspaceId, anchor.notificationId);
    if (seen.has(key)) {
      throw new EmailNotificationRestartRecoveryError(
        'CORRUPT_STATE',
        `Email notification recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(anchor);
  }
  return sortEmailNotificationAnchorsDeterministically(recovered);
}

export function buildEmailNotificationRecoveryDiagnostics(
  anchors: readonly DurableEmailNotificationAnchor[],
): EmailNotificationRecoveryDiagnostics {
  const ordered = sortEmailNotificationAnchorsDeterministically(anchors);
  let canonicalAnchorCount = 0;
  for (const anchor of ordered) {
    if (hasCanonicalAnchorFields(anchor)) canonicalAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((anchor) => anchor.workspaceId))]);
  return Object.freeze({
    owner: W5_N02_C_EMAIL_NOTIFICATION_RECOVERY_OWNER,
    restoredCount: ordered.length,
    canonicalAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((anchor) => compositeKey(anchor.workspaceId, anchor.notificationId)),
    ),
  });
}
