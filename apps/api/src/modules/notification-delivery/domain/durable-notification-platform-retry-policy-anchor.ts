export const NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformRetryPolicyAnchorState =
  (typeof NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_STATES)[number];

export type DurableNotificationPlatformRetryPolicyAnchor = Readonly<{
  workspaceId: string;
  retryPolicyAnchorId: string;
  platformRetryPolicyType: string;
  retryPolicyState: NotificationPlatformRetryPolicyAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformRetryPolicyAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformRetryPolicyAnchor }>
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
  retryPolicyAnchorId: string;
  platformRetryPolicyType: string;
  retryPolicyState: NotificationPlatformRetryPolicyAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    retryPolicyAnchorId: input.retryPolicyAnchorId,
    platformRetryPolicyType: input.platformRetryPolicyType,
    retryPolicyState: input.retryPolicyState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Retry Policy anchor for persistence (W5-N20-b).
 * Storage only — not retry policy evaluation runtime, not restart recovery, not operational continuity,
 * not transport I/O, not backoff calculation.
 */
export function buildNotificationPlatformRetryPolicyAnchorState(input: {
  workspaceId: string;
  retryPolicyAnchorId: string;
  platformRetryPolicyType: string;
  retryPolicyState?: NotificationPlatformRetryPolicyAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformRetryPolicyAnchor | null;
}): NotificationPlatformRetryPolicyAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.retryPolicyAnchorId, 'retryPolicyAnchorId');
  assertNonEmpty(input.platformRetryPolicyType, 'platformRetryPolicyType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.retryPolicyAnchorId !== input.retryPolicyAnchorId) {
    return Object.freeze({ ok: false, reason: 'retry_policy_anchor_id_mismatch' });
  }

  const retryPolicyState = input.retryPolicyState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformRetryPolicyType = input.platformRetryPolicyType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    retryPolicyAnchorId: input.retryPolicyAnchorId,
    platformRetryPolicyType,
    retryPolicyState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      retryPolicyAnchorId: input.retryPolicyAnchorId,
      platformRetryPolicyType,
      retryPolicyState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
