export const NOTIFICATION_PLATFORM_WORKERS_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_WORKERS_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformWorkersAnchorState =
  (typeof NOTIFICATION_PLATFORM_WORKERS_ANCHOR_STATES)[number];

export type DurableNotificationPlatformWorkersAnchor = Readonly<{
  workspaceId: string;
  workersAnchorId: string;
  platformWorkerType: string;
  workersState: NotificationPlatformWorkersAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformWorkersAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformWorkersAnchor }>
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
  workersAnchorId: string;
  platformWorkerType: string;
  workersState: NotificationPlatformWorkersAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    workersAnchorId: input.workersAnchorId,
    platformWorkerType: input.platformWorkerType,
    workersState: input.workersState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Workers anchor for persistence (W5-N09-b).
 * Stores canonical platform workers anchor state only — not runtime execution,
 * worker scheduler, retry, dead-letter processing, orchestration, or transport I/O.
 */
export function buildNotificationPlatformWorkersAnchorState(input: {
  workspaceId: string;
  workersAnchorId: string;
  platformWorkerType: string;
  workersState?: NotificationPlatformWorkersAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformWorkersAnchor | null;
}): NotificationPlatformWorkersAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.workersAnchorId, 'workersAnchorId');
  assertNonEmpty(input.platformWorkerType, 'platformWorkerType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.workersAnchorId !== input.workersAnchorId) {
    return Object.freeze({ ok: false, reason: 'workers_anchor_id_mismatch' });
  }

  const workersState = input.workersState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformWorkerType = input.platformWorkerType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    workersAnchorId: input.workersAnchorId,
    platformWorkerType,
    workersState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      workersAnchorId: input.workersAnchorId,
      platformWorkerType,
      workersState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_WORKERS_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
