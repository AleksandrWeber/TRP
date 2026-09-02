export const NOTIFICATION_PLATFORM_METRICS_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_METRICS_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformMetricsAnchorState =
  (typeof NOTIFICATION_PLATFORM_METRICS_ANCHOR_STATES)[number];

export type DurableNotificationPlatformMetricsAnchor = Readonly<{
  workspaceId: string;
  metricsAnchorId: string;
  platformMetricsType: string;
  metricsState: NotificationPlatformMetricsAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformMetricsAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformMetricsAnchor }>
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
  metricsAnchorId: string;
  platformMetricsType: string;
  metricsState: NotificationPlatformMetricsAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    metricsAnchorId: input.metricsAnchorId,
    platformMetricsType: input.platformMetricsType,
    metricsState: input.metricsState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Metrics anchor for persistence (W5-N16-b).
 * Stores canonical platform metrics anchor state only — not metrics collection,
 * exporters, dashboards, runtime aggregation, restart recovery, workers, or transport I/O.
 */
export function buildNotificationPlatformMetricsAnchorState(input: {
  workspaceId: string;
  metricsAnchorId: string;
  platformMetricsType: string;
  metricsState?: NotificationPlatformMetricsAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformMetricsAnchor | null;
}): NotificationPlatformMetricsAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.metricsAnchorId, 'metricsAnchorId');
  assertNonEmpty(input.platformMetricsType, 'platformMetricsType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.metricsAnchorId !== input.metricsAnchorId) {
    return Object.freeze({ ok: false, reason: 'metrics_anchor_id_mismatch' });
  }

  const metricsState = input.metricsState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformMetricsType = input.platformMetricsType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    metricsAnchorId: input.metricsAnchorId,
    platformMetricsType,
    metricsState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      metricsAnchorId: input.metricsAnchorId,
      platformMetricsType,
      metricsState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_METRICS_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
