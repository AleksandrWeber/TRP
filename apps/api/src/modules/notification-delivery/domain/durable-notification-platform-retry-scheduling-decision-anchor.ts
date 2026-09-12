export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformRetrySchedulingDecisionAnchorState =
  (typeof NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_STATES)[number];

export type DurableNotificationPlatformRetrySchedulingDecisionAnchor = Readonly<{
  workspaceId: string;
  decisionAnchorId: string;
  platformRetrySchedulingDecisionType: string;
  decisionAnchorState: NotificationPlatformRetrySchedulingDecisionAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformRetrySchedulingDecisionAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformRetrySchedulingDecisionAnchor }>
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
  decisionAnchorId: string;
  platformRetrySchedulingDecisionType: string;
  decisionAnchorState: NotificationPlatformRetrySchedulingDecisionAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    decisionAnchorId: input.decisionAnchorId,
    platformRetrySchedulingDecisionType: input.platformRetrySchedulingDecisionType,
    decisionAnchorState: input.decisionAnchorState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Retry Scheduling Decision anchor for persistence (W5-N25-b).
 * Storage only — informational; not runtime decision logic, not scheduling, not eligibility,
 * not backoff calculation, not execution, not restart recovery. Persisted data is informational only.
 */
export function buildNotificationPlatformRetrySchedulingDecisionAnchorState(input: {
  workspaceId: string;
  decisionAnchorId: string;
  platformRetrySchedulingDecisionType: string;
  decisionAnchorState?: NotificationPlatformRetrySchedulingDecisionAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformRetrySchedulingDecisionAnchor | null;
}): NotificationPlatformRetrySchedulingDecisionAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.decisionAnchorId, 'decisionAnchorId');
  assertNonEmpty(input.platformRetrySchedulingDecisionType, 'platformRetrySchedulingDecisionType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.decisionAnchorId !== input.decisionAnchorId) {
    return Object.freeze({ ok: false, reason: 'decision_anchor_id_mismatch' });
  }

  const decisionAnchorState = input.decisionAnchorState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformRetrySchedulingDecisionType = input.platformRetrySchedulingDecisionType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    decisionAnchorId: input.decisionAnchorId,
    platformRetrySchedulingDecisionType,
    decisionAnchorState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      decisionAnchorId: input.decisionAnchorId,
      platformRetrySchedulingDecisionType,
      decisionAnchorState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
