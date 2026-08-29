export const NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformWorkerExecutionAnchorState =
  (typeof NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_STATES)[number];

export type DurableNotificationPlatformWorkerExecutionAnchor = Readonly<{
  workspaceId: string;
  workerExecutionAnchorId: string;
  platformWorkerExecutionType: string;
  workerExecutionState: NotificationPlatformWorkerExecutionAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformWorkerExecutionAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformWorkerExecutionAnchor }>
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
  workerExecutionAnchorId: string;
  platformWorkerExecutionType: string;
  workerExecutionState: NotificationPlatformWorkerExecutionAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    workerExecutionAnchorId: input.workerExecutionAnchorId,
    platformWorkerExecutionType: input.platformWorkerExecutionType,
    workerExecutionState: input.workerExecutionState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Worker Execution anchor for persistence (W5-N10-b).
 * Stores canonical platform worker execution anchor state only — not runtime execution,
 * scheduler, retry, dead-letter processing, orchestration, or transport I/O.
 */
export function buildNotificationPlatformWorkerExecutionAnchorState(input: {
  workspaceId: string;
  workerExecutionAnchorId: string;
  platformWorkerExecutionType: string;
  workerExecutionState?: NotificationPlatformWorkerExecutionAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformWorkerExecutionAnchor | null;
}): NotificationPlatformWorkerExecutionAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.workerExecutionAnchorId, 'workerExecutionAnchorId');
  assertNonEmpty(input.platformWorkerExecutionType, 'platformWorkerExecutionType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (
    input.prior !== null &&
    input.prior.workerExecutionAnchorId !== input.workerExecutionAnchorId
  ) {
    return Object.freeze({ ok: false, reason: 'worker_execution_anchor_id_mismatch' });
  }

  const workerExecutionState = input.workerExecutionState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformWorkerExecutionType = input.platformWorkerExecutionType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    workerExecutionAnchorId: input.workerExecutionAnchorId,
    platformWorkerExecutionType,
    workerExecutionState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      workerExecutionAnchorId: input.workerExecutionAnchorId,
      platformWorkerExecutionType,
      workerExecutionState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
