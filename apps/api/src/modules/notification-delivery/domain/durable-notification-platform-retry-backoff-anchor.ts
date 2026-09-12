export const NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformRetryBackoffAnchorState =
  (typeof NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_STATES)[number];

export type DurableNotificationPlatformRetryBackoffAnchor = Readonly<{
  workspaceId: string;
  retryBackoffAnchorId: string;
  platformRetryBackoffType: string;
  retryBackoffState: NotificationPlatformRetryBackoffAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformRetryBackoffAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformRetryBackoffAnchor }>
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
  retryBackoffAnchorId: string;
  platformRetryBackoffType: string;
  retryBackoffState: NotificationPlatformRetryBackoffAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    retryBackoffAnchorId: input.retryBackoffAnchorId,
    platformRetryBackoffType: input.platformRetryBackoffType,
    retryBackoffState: input.retryBackoffState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Retry Backoff anchor for persistence (W5-N21-b).
 * Storage only — not backoff calculation runtime, not restart recovery, not operational continuity,
 * not transport I/O, not policy evaluation.
 */
export function buildNotificationPlatformRetryBackoffAnchorState(input: {
  workspaceId: string;
  retryBackoffAnchorId: string;
  platformRetryBackoffType: string;
  retryBackoffState?: NotificationPlatformRetryBackoffAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformRetryBackoffAnchor | null;
}): NotificationPlatformRetryBackoffAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.retryBackoffAnchorId, 'retryBackoffAnchorId');
  assertNonEmpty(input.platformRetryBackoffType, 'platformRetryBackoffType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.retryBackoffAnchorId !== input.retryBackoffAnchorId) {
    return Object.freeze({ ok: false, reason: 'retry_backoff_anchor_id_mismatch' });
  }

  const retryBackoffState = input.retryBackoffState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformRetryBackoffType = input.platformRetryBackoffType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    retryBackoffAnchorId: input.retryBackoffAnchorId,
    platformRetryBackoffType,
    retryBackoffState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      retryBackoffAnchorId: input.retryBackoffAnchorId,
      platformRetryBackoffType,
      retryBackoffState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
