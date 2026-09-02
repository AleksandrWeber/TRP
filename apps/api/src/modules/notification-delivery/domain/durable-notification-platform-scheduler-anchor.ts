export const NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformSchedulerAnchorState =
  (typeof NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_STATES)[number];

export type DurableNotificationPlatformSchedulerAnchor = Readonly<{
  workspaceId: string;
  schedulerAnchorId: string;
  platformSchedulerType: string;
  schedulerState: NotificationPlatformSchedulerAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformSchedulerAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformSchedulerAnchor }>
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
  schedulerAnchorId: string;
  platformSchedulerType: string;
  schedulerState: NotificationPlatformSchedulerAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    schedulerAnchorId: input.schedulerAnchorId,
    platformSchedulerType: input.platformSchedulerType,
    schedulerState: input.schedulerState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Scheduler anchor for persistence (W5-N12-b).
 * Stores canonical platform scheduler anchor state only — not scheduler runtime,
 * scheduling engine, execution loop, retry, dead-letter processing, orchestration, or transport I/O.
 */
export function buildNotificationPlatformSchedulerAnchorState(input: {
  workspaceId: string;
  schedulerAnchorId: string;
  platformSchedulerType: string;
  schedulerState?: NotificationPlatformSchedulerAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformSchedulerAnchor | null;
}): NotificationPlatformSchedulerAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.schedulerAnchorId, 'schedulerAnchorId');
  assertNonEmpty(input.platformSchedulerType, 'platformSchedulerType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.schedulerAnchorId !== input.schedulerAnchorId) {
    return Object.freeze({ ok: false, reason: 'scheduler_anchor_id_mismatch' });
  }

  const schedulerState = input.schedulerState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformSchedulerType = input.platformSchedulerType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    schedulerAnchorId: input.schedulerAnchorId,
    platformSchedulerType,
    schedulerState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      schedulerAnchorId: input.schedulerAnchorId,
      platformSchedulerType,
      schedulerState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
