export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformRetrySchedulingAnchorState =
  (typeof NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_STATES)[number];

export type DurableNotificationPlatformRetrySchedulingAnchor = Readonly<{
  workspaceId: string;
  retrySchedulingAnchorId: string;
  platformRetrySchedulingType: string;
  retrySchedulingState: NotificationPlatformRetrySchedulingAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformRetrySchedulingAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformRetrySchedulingAnchor }>
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
  retrySchedulingAnchorId: string;
  platformRetrySchedulingType: string;
  retrySchedulingState: NotificationPlatformRetrySchedulingAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    retrySchedulingAnchorId: input.retrySchedulingAnchorId,
    platformRetrySchedulingType: input.platformRetrySchedulingType,
    retrySchedulingState: input.retrySchedulingState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Retry Scheduling anchor for persistence (W5-N19-b).
 * Storage only — not retry scheduling runtime, not restart recovery, not operational continuity,
 * not transport I/O, not retry timing calculation.
 */
export function buildNotificationPlatformRetrySchedulingAnchorState(input: {
  workspaceId: string;
  retrySchedulingAnchorId: string;
  platformRetrySchedulingType: string;
  retrySchedulingState?: NotificationPlatformRetrySchedulingAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformRetrySchedulingAnchor | null;
}): NotificationPlatformRetrySchedulingAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.retrySchedulingAnchorId, 'retrySchedulingAnchorId');
  assertNonEmpty(input.platformRetrySchedulingType, 'platformRetrySchedulingType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (
    input.prior !== null &&
    input.prior.retrySchedulingAnchorId !== input.retrySchedulingAnchorId
  ) {
    return Object.freeze({ ok: false, reason: 'retry_scheduling_anchor_id_mismatch' });
  }

  const retrySchedulingState = input.retrySchedulingState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformRetrySchedulingType = input.platformRetrySchedulingType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    retrySchedulingAnchorId: input.retrySchedulingAnchorId,
    platformRetrySchedulingType,
    retrySchedulingState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      retrySchedulingAnchorId: input.retrySchedulingAnchorId,
      platformRetrySchedulingType,
      retrySchedulingState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
