export const NOTIFICATION_PLATFORM_QUEUE_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_QUEUE_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformQueueAnchorState =
  (typeof NOTIFICATION_PLATFORM_QUEUE_ANCHOR_STATES)[number];

export type DurableNotificationPlatformQueueAnchor = Readonly<{
  workspaceId: string;
  queueAnchorId: string;
  platformQueueType: string;
  queueState: NotificationPlatformQueueAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformQueueAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformQueueAnchor }>
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
  queueAnchorId: string;
  platformQueueType: string;
  queueState: NotificationPlatformQueueAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    queueAnchorId: input.queueAnchorId,
    platformQueueType: input.platformQueueType,
    queueState: input.queueState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Queue anchor for persistence (W5-N08-b).
 * Stores canonical platform queue anchor state only — not runtime execution,
 * queue workers, retry, scheduler, dispatcher, or transport I/O.
 */
export function buildNotificationPlatformQueueAnchorState(input: {
  workspaceId: string;
  queueAnchorId: string;
  platformQueueType: string;
  queueState?: NotificationPlatformQueueAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformQueueAnchor | null;
}): NotificationPlatformQueueAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.queueAnchorId, 'queueAnchorId');
  assertNonEmpty(input.platformQueueType, 'platformQueueType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.queueAnchorId !== input.queueAnchorId) {
    return Object.freeze({ ok: false, reason: 'queue_anchor_id_mismatch' });
  }

  const queueState = input.queueState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformQueueType = input.platformQueueType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    queueAnchorId: input.queueAnchorId,
    platformQueueType,
    queueState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      queueAnchorId: input.queueAnchorId,
      platformQueueType,
      queueState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_QUEUE_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
