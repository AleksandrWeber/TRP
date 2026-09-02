export const NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformReliabilityAnchorState =
  (typeof NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_STATES)[number];

export type DurableNotificationPlatformReliabilityAnchor = Readonly<{
  workspaceId: string;
  reliabilityAnchorId: string;
  platformReliabilityType: string;
  reliabilityState: NotificationPlatformReliabilityAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformReliabilityAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformReliabilityAnchor }>
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
  reliabilityAnchorId: string;
  platformReliabilityType: string;
  reliabilityState: NotificationPlatformReliabilityAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    reliabilityAnchorId: input.reliabilityAnchorId,
    platformReliabilityType: input.platformReliabilityType,
    reliabilityState: input.reliabilityState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Delivery Reliability anchor for persistence (W5-N17-b).
 * Stores canonical platform reliability anchor state only — not delivery execution runtime,
 * restart recovery, operational continuity, retry execution, or transport I/O.
 */
export function buildNotificationPlatformReliabilityAnchorState(input: {
  workspaceId: string;
  reliabilityAnchorId: string;
  platformReliabilityType: string;
  reliabilityState?: NotificationPlatformReliabilityAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformReliabilityAnchor | null;
}): NotificationPlatformReliabilityAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.reliabilityAnchorId, 'reliabilityAnchorId');
  assertNonEmpty(input.platformReliabilityType, 'platformReliabilityType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.reliabilityAnchorId !== input.reliabilityAnchorId) {
    return Object.freeze({ ok: false, reason: 'reliability_anchor_id_mismatch' });
  }

  const reliabilityState = input.reliabilityState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformReliabilityType = input.platformReliabilityType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    reliabilityAnchorId: input.reliabilityAnchorId,
    platformReliabilityType,
    reliabilityState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      reliabilityAnchorId: input.reliabilityAnchorId,
      platformReliabilityType,
      reliabilityState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
