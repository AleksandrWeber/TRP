export const NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformRetryBackoffCalculationAnchorState =
  (typeof NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_STATES)[number];

export type DurableNotificationPlatformRetryBackoffCalculationAnchor = Readonly<{
  workspaceId: string;
  calculationAnchorId: string;
  platformBackoffCalculationType: string;
  calculationAnchorState: NotificationPlatformRetryBackoffCalculationAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformRetryBackoffCalculationAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformRetryBackoffCalculationAnchor }>
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
  calculationAnchorId: string;
  platformBackoffCalculationType: string;
  calculationAnchorState: NotificationPlatformRetryBackoffCalculationAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    calculationAnchorId: input.calculationAnchorId,
    platformBackoffCalculationType: input.platformBackoffCalculationType,
    calculationAnchorState: input.calculationAnchorState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Retry Backoff Calculation anchor for persistence (W5-N22-b).
 * Storage only — not calculation runtime, not scheduling, not execution, not restart recovery,
 * not operational continuity. Persisted data is informational only.
 */
export function buildNotificationPlatformRetryBackoffCalculationAnchorState(input: {
  workspaceId: string;
  calculationAnchorId: string;
  platformBackoffCalculationType: string;
  calculationAnchorState?: NotificationPlatformRetryBackoffCalculationAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformRetryBackoffCalculationAnchor | null;
}): NotificationPlatformRetryBackoffCalculationAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.calculationAnchorId, 'calculationAnchorId');
  assertNonEmpty(input.platformBackoffCalculationType, 'platformBackoffCalculationType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.calculationAnchorId !== input.calculationAnchorId) {
    return Object.freeze({ ok: false, reason: 'calculation_anchor_id_mismatch' });
  }

  const calculationAnchorState = input.calculationAnchorState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformBackoffCalculationType = input.platformBackoffCalculationType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    calculationAnchorId: input.calculationAnchorId,
    platformBackoffCalculationType,
    calculationAnchorState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      calculationAnchorId: input.calculationAnchorId,
      platformBackoffCalculationType,
      calculationAnchorState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
