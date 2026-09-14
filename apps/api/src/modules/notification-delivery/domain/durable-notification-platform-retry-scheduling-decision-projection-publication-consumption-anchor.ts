export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_STATES =
  Object.freeze(['anchor-recorded'] as const);

export type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState =
  (typeof NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_STATES)[number];

export type DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor =
  Readonly<{
    workspaceId: string;
    consumptionAnchorId: string;
    platformRetrySchedulingDecisionProjectionPublicationConsumptionType: string;
    consumptionAnchorState: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState;
    channelScope: string | null;
    integrityMetadata: string | null;
    correlationId: string | null;
    schemaVersion: number;
    recordedAt: string;
    recordedByActorId: string | null;
    updatedAt: string;
  }>;

export type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorPersistenceOutcome =
  | Readonly<{
      ok: true;
      anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor;
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
  consumptionAnchorId: string;
  platformRetrySchedulingDecisionProjectionPublicationConsumptionType: string;
  consumptionAnchorState: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    consumptionAnchorId: input.consumptionAnchorId,
    platformRetrySchedulingDecisionProjectionPublicationConsumptionType:
      input.platformRetrySchedulingDecisionProjectionPublicationConsumptionType,
    consumptionAnchorState: input.consumptionAnchorState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Retry Scheduling Decision Projection Publication Consumption
 * anchor for persistence (W5-N29-b).
 * Storage only — informational; not runtime consumption, not runtime publication, not runtime decision
 * projection, not scheduling, not eligibility, not backoff calculation, not execution, not restart recovery.
 * Persisted data is informational only.
 */
export function buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState(input: {
  workspaceId: string;
  consumptionAnchorId: string;
  platformRetrySchedulingDecisionProjectionPublicationConsumptionType: string;
  consumptionAnchorState?: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor | null;
}): NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.consumptionAnchorId, 'consumptionAnchorId');
  assertNonEmpty(
    input.platformRetrySchedulingDecisionProjectionPublicationConsumptionType,
    'platformRetrySchedulingDecisionProjectionPublicationConsumptionType',
  );
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.consumptionAnchorId !== input.consumptionAnchorId) {
    return Object.freeze({ ok: false, reason: 'consumption_anchor_id_mismatch' });
  }

  const consumptionAnchorState = input.consumptionAnchorState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformRetrySchedulingDecisionProjectionPublicationConsumptionType =
    input.platformRetrySchedulingDecisionProjectionPublicationConsumptionType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    consumptionAnchorId: input.consumptionAnchorId,
    platformRetrySchedulingDecisionProjectionPublicationConsumptionType,
    consumptionAnchorState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      consumptionAnchorId: input.consumptionAnchorId,
      platformRetrySchedulingDecisionProjectionPublicationConsumptionType,
      consumptionAnchorState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion:
      NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
