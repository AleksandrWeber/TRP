export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_STATES =
  Object.freeze(['anchor-recorded'] as const);

export type NotificationPlatformRetrySchedulingDecisionEvaluationAnchorState =
  (typeof NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_STATES)[number];

export type DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor = Readonly<{
  workspaceId: string;
  evaluationAnchorId: string;
  platformRetrySchedulingDecisionEvaluationType: string;
  evaluationAnchorState: NotificationPlatformRetrySchedulingDecisionEvaluationAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformRetrySchedulingDecisionEvaluationAnchorPersistenceOutcome =
  | Readonly<{
      ok: true;
      anchor: DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor;
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
  evaluationAnchorId: string;
  platformRetrySchedulingDecisionEvaluationType: string;
  evaluationAnchorState: NotificationPlatformRetrySchedulingDecisionEvaluationAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    evaluationAnchorId: input.evaluationAnchorId,
    platformRetrySchedulingDecisionEvaluationType:
      input.platformRetrySchedulingDecisionEvaluationType,
    evaluationAnchorState: input.evaluationAnchorState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Retry Scheduling Decision Evaluation anchor for persistence (W5-N26-b).
 * Storage only — informational; not runtime decision evaluation, not scheduling, not eligibility,
 * not backoff calculation, not execution, not restart recovery. Persisted data is informational only.
 */
export function buildNotificationPlatformRetrySchedulingDecisionEvaluationAnchorState(input: {
  workspaceId: string;
  evaluationAnchorId: string;
  platformRetrySchedulingDecisionEvaluationType: string;
  evaluationAnchorState?: NotificationPlatformRetrySchedulingDecisionEvaluationAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor | null;
}): NotificationPlatformRetrySchedulingDecisionEvaluationAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.evaluationAnchorId, 'evaluationAnchorId');
  assertNonEmpty(
    input.platformRetrySchedulingDecisionEvaluationType,
    'platformRetrySchedulingDecisionEvaluationType',
  );
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.evaluationAnchorId !== input.evaluationAnchorId) {
    return Object.freeze({ ok: false, reason: 'evaluation_anchor_id_mismatch' });
  }

  const evaluationAnchorState = input.evaluationAnchorState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformRetrySchedulingDecisionEvaluationType =
    input.platformRetrySchedulingDecisionEvaluationType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    evaluationAnchorId: input.evaluationAnchorId,
    platformRetrySchedulingDecisionEvaluationType,
    evaluationAnchorState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      evaluationAnchorId: input.evaluationAnchorId,
      platformRetrySchedulingDecisionEvaluationType,
      evaluationAnchorState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
