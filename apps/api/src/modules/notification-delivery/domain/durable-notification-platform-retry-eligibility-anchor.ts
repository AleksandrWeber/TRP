export const NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformRetryEligibilityAnchorState =
  (typeof NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_STATES)[number];

export type DurableNotificationPlatformRetryEligibilityAnchor = Readonly<{
  workspaceId: string;
  eligibilityAnchorId: string;
  platformRetryEligibilityType: string;
  eligibilityAnchorState: NotificationPlatformRetryEligibilityAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformRetryEligibilityAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformRetryEligibilityAnchor }>
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
  eligibilityAnchorId: string;
  platformRetryEligibilityType: string;
  eligibilityAnchorState: NotificationPlatformRetryEligibilityAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    eligibilityAnchorId: input.eligibilityAnchorId,
    platformRetryEligibilityType: input.platformRetryEligibilityType,
    eligibilityAnchorState: input.eligibilityAnchorState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Retry Eligibility anchor for persistence (W5-N23-b).
 * Storage only — informational; not eligibility evaluation, not calculation, not scheduling,
 * not execution, not restart recovery. Persisted data is informational only.
 */
export function buildNotificationPlatformRetryEligibilityAnchorState(input: {
  workspaceId: string;
  eligibilityAnchorId: string;
  platformRetryEligibilityType: string;
  eligibilityAnchorState?: NotificationPlatformRetryEligibilityAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformRetryEligibilityAnchor | null;
}): NotificationPlatformRetryEligibilityAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.eligibilityAnchorId, 'eligibilityAnchorId');
  assertNonEmpty(input.platformRetryEligibilityType, 'platformRetryEligibilityType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.eligibilityAnchorId !== input.eligibilityAnchorId) {
    return Object.freeze({ ok: false, reason: 'eligibility_anchor_id_mismatch' });
  }

  const eligibilityAnchorState = input.eligibilityAnchorState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformRetryEligibilityType = input.platformRetryEligibilityType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    eligibilityAnchorId: input.eligibilityAnchorId,
    platformRetryEligibilityType,
    eligibilityAnchorState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      eligibilityAnchorId: input.eligibilityAnchorId,
      platformRetryEligibilityType,
      eligibilityAnchorState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
