export const NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformDeadLetterAnchorState =
  (typeof NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_STATES)[number];

export type DurableNotificationPlatformDeadLetterAnchor = Readonly<{
  workspaceId: string;
  deadLetterAnchorId: string;
  platformDeadLetterType: string;
  deadLetterState: NotificationPlatformDeadLetterAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformDeadLetterAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformDeadLetterAnchor }>
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
  deadLetterAnchorId: string;
  platformDeadLetterType: string;
  deadLetterState: NotificationPlatformDeadLetterAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    deadLetterAnchorId: input.deadLetterAnchorId,
    platformDeadLetterType: input.platformDeadLetterType,
    deadLetterState: input.deadLetterState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Dead Letter anchor for persistence (W5-N14-b).
 * Stores canonical platform dead-letter anchor state only — not dead-letter runtime,
 * dead-letter replay, dead-letter processing, retry execution, scheduler integration,
 * workers, or transport I/O.
 */
export function buildNotificationPlatformDeadLetterAnchorState(input: {
  workspaceId: string;
  deadLetterAnchorId: string;
  platformDeadLetterType: string;
  deadLetterState?: NotificationPlatformDeadLetterAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformDeadLetterAnchor | null;
}): NotificationPlatformDeadLetterAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.deadLetterAnchorId, 'deadLetterAnchorId');
  assertNonEmpty(input.platformDeadLetterType, 'platformDeadLetterType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.deadLetterAnchorId !== input.deadLetterAnchorId) {
    return Object.freeze({ ok: false, reason: 'dead_letter_anchor_id_mismatch' });
  }

  const deadLetterState = input.deadLetterState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformDeadLetterType = input.platformDeadLetterType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    deadLetterAnchorId: input.deadLetterAnchorId,
    platformDeadLetterType,
    deadLetterState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      deadLetterAnchorId: input.deadLetterAnchorId,
      platformDeadLetterType,
      deadLetterState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
