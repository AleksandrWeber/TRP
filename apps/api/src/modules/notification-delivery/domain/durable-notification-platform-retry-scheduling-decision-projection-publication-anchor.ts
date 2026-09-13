export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_STATES =
  Object.freeze(['anchor-recorded'] as const);

export type NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState =
  (typeof NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_STATES)[number];

export type DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor =
  Readonly<{
    workspaceId: string;
    publicationAnchorId: string;
    platformRetrySchedulingDecisionProjectionPublicationType: string;
    publicationAnchorState: NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState;
    channelScope: string | null;
    integrityMetadata: string | null;
    correlationId: string | null;
    schemaVersion: number;
    recordedAt: string;
    recordedByActorId: string | null;
    updatedAt: string;
  }>;

export type NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorPersistenceOutcome =
  | Readonly<{
      ok: true;
      anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor;
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
  publicationAnchorId: string;
  platformRetrySchedulingDecisionProjectionPublicationType: string;
  publicationAnchorState: NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    publicationAnchorId: input.publicationAnchorId,
    platformRetrySchedulingDecisionProjectionPublicationType:
      input.platformRetrySchedulingDecisionProjectionPublicationType,
    publicationAnchorState: input.publicationAnchorState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Retry Scheduling Decision Projection Publication anchor for persistence (W5-N28-b).
 * Storage only — informational; not runtime publication, not runtime decision projection, not scheduling, not eligibility,
 * not backoff calculation, not execution, not restart recovery. Persisted data is informational only.
 */
export function buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState(input: {
  workspaceId: string;
  publicationAnchorId: string;
  platformRetrySchedulingDecisionProjectionPublicationType: string;
  publicationAnchorState?: NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor | null;
}): NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.publicationAnchorId, 'publicationAnchorId');
  assertNonEmpty(
    input.platformRetrySchedulingDecisionProjectionPublicationType,
    'platformRetrySchedulingDecisionProjectionPublicationType',
  );
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.publicationAnchorId !== input.publicationAnchorId) {
    return Object.freeze({ ok: false, reason: 'publication_anchor_id_mismatch' });
  }

  const publicationAnchorState = input.publicationAnchorState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformRetrySchedulingDecisionProjectionPublicationType =
    input.platformRetrySchedulingDecisionProjectionPublicationType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    publicationAnchorId: input.publicationAnchorId,
    platformRetrySchedulingDecisionProjectionPublicationType,
    publicationAnchorState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      publicationAnchorId: input.publicationAnchorId,
      platformRetrySchedulingDecisionProjectionPublicationType,
      publicationAnchorState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion:
      NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
