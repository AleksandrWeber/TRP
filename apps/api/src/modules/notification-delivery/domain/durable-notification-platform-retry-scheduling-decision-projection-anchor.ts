export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_STATES =
  Object.freeze(['anchor-recorded'] as const);

export type NotificationPlatformRetrySchedulingDecisionProjectionAnchorState =
  (typeof NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_STATES)[number];

export type DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor = Readonly<{
  workspaceId: string;
  projectionAnchorId: string;
  platformRetrySchedulingDecisionProjectionType: string;
  projectionAnchorState: NotificationPlatformRetrySchedulingDecisionProjectionAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformRetrySchedulingDecisionProjectionAnchorPersistenceOutcome =
  | Readonly<{
      ok: true;
      anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor;
    }>
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
  projectionAnchorId: string;
  platformRetrySchedulingDecisionProjectionType: string;
  projectionAnchorState: NotificationPlatformRetrySchedulingDecisionProjectionAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    projectionAnchorId: input.projectionAnchorId,
    platformRetrySchedulingDecisionProjectionType:
      input.platformRetrySchedulingDecisionProjectionType,
    projectionAnchorState: input.projectionAnchorState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Retry Scheduling Decision Projection anchor for persistence (W5-N27-b).
 * Storage only — informational; not runtime decision projection, not scheduling, not eligibility,
 * not backoff calculation, not execution, not restart recovery. Persisted data is informational only.
 */
export function buildNotificationPlatformRetrySchedulingDecisionProjectionAnchorState(input: {
  workspaceId: string;
  projectionAnchorId: string;
  platformRetrySchedulingDecisionProjectionType: string;
  projectionAnchorState?: NotificationPlatformRetrySchedulingDecisionProjectionAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor | null;
}): NotificationPlatformRetrySchedulingDecisionProjectionAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.projectionAnchorId, 'projectionAnchorId');
  assertNonEmpty(
    input.platformRetrySchedulingDecisionProjectionType,
    'platformRetrySchedulingDecisionProjectionType',
  );
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.projectionAnchorId !== input.projectionAnchorId) {
    return Object.freeze({ ok: false, reason: 'projection_anchor_id_mismatch' });
  }

  const projectionAnchorState = input.projectionAnchorState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformRetrySchedulingDecisionProjectionType =
    input.platformRetrySchedulingDecisionProjectionType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    projectionAnchorId: input.projectionAnchorId,
    platformRetrySchedulingDecisionProjectionType,
    projectionAnchorState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      projectionAnchorId: input.projectionAnchorId,
      platformRetrySchedulingDecisionProjectionType,
      projectionAnchorState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
