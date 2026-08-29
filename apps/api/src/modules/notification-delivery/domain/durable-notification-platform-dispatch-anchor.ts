export const NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformDispatchAnchorState =
  (typeof NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_STATES)[number];

export type DurableNotificationPlatformDispatchAnchor = Readonly<{
  workspaceId: string;
  dispatchAnchorId: string;
  platformDispatchType: string;
  dispatchState: NotificationPlatformDispatchAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformDispatchAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformDispatchAnchor }>
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
  dispatchAnchorId: string;
  platformDispatchType: string;
  dispatchState: NotificationPlatformDispatchAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    dispatchAnchorId: input.dispatchAnchorId,
    platformDispatchType: input.platformDispatchType,
    dispatchState: input.dispatchState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Dispatch anchor for persistence (W5-N07-b).
 * Stores canonical platform dispatch anchor state only — not runtime execution,
 * dispatcher, queue workers, retry, scheduler, or transport I/O.
 */
export function buildNotificationPlatformDispatchAnchorState(input: {
  workspaceId: string;
  dispatchAnchorId: string;
  platformDispatchType: string;
  dispatchState?: NotificationPlatformDispatchAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformDispatchAnchor | null;
}): NotificationPlatformDispatchAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.dispatchAnchorId, 'dispatchAnchorId');
  assertNonEmpty(input.platformDispatchType, 'platformDispatchType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.dispatchAnchorId !== input.dispatchAnchorId) {
    return Object.freeze({ ok: false, reason: 'dispatch_anchor_id_mismatch' });
  }

  const dispatchState = input.dispatchState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformDispatchType = input.platformDispatchType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    dispatchAnchorId: input.dispatchAnchorId,
    platformDispatchType,
    dispatchState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      dispatchAnchorId: input.dispatchAnchorId,
      platformDispatchType,
      dispatchState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
