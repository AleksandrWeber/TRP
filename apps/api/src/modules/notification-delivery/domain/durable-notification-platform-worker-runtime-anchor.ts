export const NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformWorkerRuntimeAnchorState =
  (typeof NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_STATES)[number];

export type DurableNotificationPlatformWorkerRuntimeAnchor = Readonly<{
  workspaceId: string;
  workerRuntimeAnchorId: string;
  platformWorkerRuntimeType: string;
  workerRuntimeState: NotificationPlatformWorkerRuntimeAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformWorkerRuntimeAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformWorkerRuntimeAnchor }>
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
  workerRuntimeAnchorId: string;
  platformWorkerRuntimeType: string;
  workerRuntimeState: NotificationPlatformWorkerRuntimeAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    workerRuntimeAnchorId: input.workerRuntimeAnchorId,
    platformWorkerRuntimeType: input.platformWorkerRuntimeType,
    workerRuntimeState: input.workerRuntimeState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Worker Runtime anchor for persistence (W5-N11-b).
 * Stores canonical platform worker runtime anchor state only — not runtime execution,
 * scheduler, retry, dead-letter processing, orchestration, or transport I/O.
 */
export function buildNotificationPlatformWorkerRuntimeAnchorState(input: {
  workspaceId: string;
  workerRuntimeAnchorId: string;
  platformWorkerRuntimeType: string;
  workerRuntimeState?: NotificationPlatformWorkerRuntimeAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformWorkerRuntimeAnchor | null;
}): NotificationPlatformWorkerRuntimeAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.workerRuntimeAnchorId, 'workerRuntimeAnchorId');
  assertNonEmpty(input.platformWorkerRuntimeType, 'platformWorkerRuntimeType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.workerRuntimeAnchorId !== input.workerRuntimeAnchorId) {
    return Object.freeze({ ok: false, reason: 'worker_runtime_anchor_id_mismatch' });
  }

  const workerRuntimeState = input.workerRuntimeState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformWorkerRuntimeType = input.platformWorkerRuntimeType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    workerRuntimeAnchorId: input.workerRuntimeAnchorId,
    platformWorkerRuntimeType,
    workerRuntimeState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      workerRuntimeAnchorId: input.workerRuntimeAnchorId,
      platformWorkerRuntimeType,
      workerRuntimeState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
