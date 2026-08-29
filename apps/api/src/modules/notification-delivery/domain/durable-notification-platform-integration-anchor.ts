export const NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformIntegrationAnchorState =
  (typeof NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_STATES)[number];

export type DurableNotificationPlatformIntegrationAnchor = Readonly<{
  workspaceId: string;
  integrationAnchorId: string;
  platformIntegrationType: string;
  integrationState: NotificationPlatformIntegrationAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformIntegrationAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformIntegrationAnchor }>
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
  integrationAnchorId: string;
  platformIntegrationType: string;
  integrationState: NotificationPlatformIntegrationAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    integrationAnchorId: input.integrationAnchorId,
    platformIntegrationType: input.platformIntegrationType,
    integrationState: input.integrationState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Integration anchor for persistence (W5-N05-b).
 * Stores canonical platform integration state only — not delivery, runtime, or transport I/O.
 */
export function buildNotificationPlatformIntegrationAnchorState(input: {
  workspaceId: string;
  integrationAnchorId: string;
  platformIntegrationType: string;
  integrationState?: NotificationPlatformIntegrationAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformIntegrationAnchor | null;
}): NotificationPlatformIntegrationAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.integrationAnchorId, 'integrationAnchorId');
  assertNonEmpty(input.platformIntegrationType, 'platformIntegrationType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.integrationAnchorId !== input.integrationAnchorId) {
    return Object.freeze({ ok: false, reason: 'integration_anchor_id_mismatch' });
  }

  const integrationState = input.integrationState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformIntegrationType = input.platformIntegrationType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    integrationAnchorId: input.integrationAnchorId,
    platformIntegrationType,
    integrationState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      integrationAnchorId: input.integrationAnchorId,
      platformIntegrationType,
      integrationState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
