export const NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformRetryExecutionAnchorState =
  (typeof NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_STATES)[number];

export type DurableNotificationPlatformRetryExecutionAnchor = Readonly<{
  workspaceId: string;
  retryExecutionAnchorId: string;
  platformRetryExecutionType: string;
  retryExecutionState: NotificationPlatformRetryExecutionAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformRetryExecutionAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformRetryExecutionAnchor }>
  | Readonly<{ ok: false; reason: string }>;

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`Invalid ISO timestamp for ${label}: ${value}`);
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be non-empty`);
  }
}

function buildIntegrityMetadata(input: {
  workspaceId: string;
  retryExecutionAnchorId: string;
  platformRetryExecutionType: string;
  retryExecutionState: NotificationPlatformRetryExecutionAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    retryExecutionAnchorId: input.retryExecutionAnchorId,
    platformRetryExecutionType: input.platformRetryExecutionType,
    retryExecutionState: input.retryExecutionState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Retry Execution anchor for persistence (W5-N18-b).
 * Storage only — not retry execution runtime, not restart recovery, not operational continuity,
 * not transport I/O.
 */
export function buildNotificationPlatformRetryExecutionAnchorState(input: {
  workspaceId: string;
  retryExecutionAnchorId: string;
  platformRetryExecutionType: string;
  retryExecutionState?: NotificationPlatformRetryExecutionAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformRetryExecutionAnchor | null;
}): NotificationPlatformRetryExecutionAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.retryExecutionAnchorId, 'retryExecutionAnchorId');
  assertNonEmpty(input.platformRetryExecutionType, 'platformRetryExecutionType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.retryExecutionAnchorId !== input.retryExecutionAnchorId) {
    return Object.freeze({ ok: false, reason: 'retry_execution_anchor_id_mismatch' });
  }

  const retryExecutionState = input.retryExecutionState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformRetryExecutionType = input.platformRetryExecutionType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    retryExecutionAnchorId: input.retryExecutionAnchorId,
    platformRetryExecutionType,
    retryExecutionState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      retryExecutionAnchorId: input.retryExecutionAnchorId,
      platformRetryExecutionType,
      retryExecutionState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
