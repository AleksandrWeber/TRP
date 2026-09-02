export const NOTIFICATION_PLATFORM_RETRY_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_RETRY_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformRetryAnchorState =
  (typeof NOTIFICATION_PLATFORM_RETRY_ANCHOR_STATES)[number];

export type DurableNotificationPlatformRetryAnchor = Readonly<{
  workspaceId: string;
  retryAnchorId: string;
  platformRetryType: string;
  retryState: NotificationPlatformRetryAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformRetryAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformRetryAnchor }>
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
  retryAnchorId: string;
  platformRetryType: string;
  retryState: NotificationPlatformRetryAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    retryAnchorId: input.retryAnchorId,
    platformRetryType: input.platformRetryType,
    retryState: input.retryState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Retry anchor for persistence (W5-N13-b).
 * Stores canonical platform retry anchor state only — not retry runtime,
 * retry execution, retry scheduling, retry queue processing, dead-letter processing,
 * orchestration, or transport I/O.
 */
export function buildNotificationPlatformRetryAnchorState(input: {
  workspaceId: string;
  retryAnchorId: string;
  platformRetryType: string;
  retryState?: NotificationPlatformRetryAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformRetryAnchor | null;
}): NotificationPlatformRetryAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.retryAnchorId, 'retryAnchorId');
  assertNonEmpty(input.platformRetryType, 'platformRetryType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.retryAnchorId !== input.retryAnchorId) {
    return Object.freeze({ ok: false, reason: 'retry_anchor_id_mismatch' });
  }

  const retryState = input.retryState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformRetryType = input.platformRetryType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    retryAnchorId: input.retryAnchorId,
    platformRetryType,
    retryState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      retryAnchorId: input.retryAnchorId,
      platformRetryType,
      retryState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_RETRY_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
