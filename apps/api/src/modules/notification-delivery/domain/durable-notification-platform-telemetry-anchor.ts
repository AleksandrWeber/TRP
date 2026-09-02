export const NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformTelemetryAnchorState =
  (typeof NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_STATES)[number];

export type DurableNotificationPlatformTelemetryAnchor = Readonly<{
  workspaceId: string;
  telemetryAnchorId: string;
  platformTelemetryType: string;
  telemetryState: NotificationPlatformTelemetryAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformTelemetryAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformTelemetryAnchor }>
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
  telemetryAnchorId: string;
  platformTelemetryType: string;
  telemetryState: NotificationPlatformTelemetryAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    telemetryAnchorId: input.telemetryAnchorId,
    platformTelemetryType: input.platformTelemetryType,
    telemetryState: input.telemetryState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Telemetry anchor for persistence (W5-N15-b).
 * Stores canonical platform telemetry anchor state only — not metrics collection,
 * exporters, dashboards, runtime aggregation, restart recovery, workers, or transport I/O.
 */
export function buildNotificationPlatformTelemetryAnchorState(input: {
  workspaceId: string;
  telemetryAnchorId: string;
  platformTelemetryType: string;
  telemetryState?: NotificationPlatformTelemetryAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformTelemetryAnchor | null;
}): NotificationPlatformTelemetryAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.telemetryAnchorId, 'telemetryAnchorId');
  assertNonEmpty(input.platformTelemetryType, 'platformTelemetryType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.telemetryAnchorId !== input.telemetryAnchorId) {
    return Object.freeze({ ok: false, reason: 'telemetry_anchor_id_mismatch' });
  }

  const telemetryState = input.telemetryState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformTelemetryType = input.platformTelemetryType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    telemetryAnchorId: input.telemetryAnchorId,
    platformTelemetryType,
    telemetryState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      telemetryAnchorId: input.telemetryAnchorId,
      platformTelemetryType,
      telemetryState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
