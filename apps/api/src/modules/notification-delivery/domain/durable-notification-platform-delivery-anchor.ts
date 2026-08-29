export const NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_SCHEMA_VERSION = 1;

export const NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type NotificationPlatformDeliveryAnchorState =
  (typeof NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_STATES)[number];

export type DurableNotificationPlatformDeliveryAnchor = Readonly<{
  workspaceId: string;
  deliveryAnchorId: string;
  platformDeliveryType: string;
  deliveryState: NotificationPlatformDeliveryAnchorState;
  channelScope: string | null;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type NotificationPlatformDeliveryAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableNotificationPlatformDeliveryAnchor }>
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
  deliveryAnchorId: string;
  platformDeliveryType: string;
  deliveryState: NotificationPlatformDeliveryAnchorState;
  channelScope: string | null;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    deliveryAnchorId: input.deliveryAnchorId,
    platformDeliveryType: input.platformDeliveryType,
    deliveryState: input.deliveryState,
    channelScope: input.channelScope,
  });
}

/**
 * Build durable Notification Platform Delivery anchor for persistence (W5-N06-b).
 * Stores canonical platform delivery anchor state only — not runtime execution,
 * dispatcher, queue workers, retry, scheduler, or transport I/O.
 */
export function buildNotificationPlatformDeliveryAnchorState(input: {
  workspaceId: string;
  deliveryAnchorId: string;
  platformDeliveryType: string;
  deliveryState?: NotificationPlatformDeliveryAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableNotificationPlatformDeliveryAnchor | null;
}): NotificationPlatformDeliveryAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.deliveryAnchorId, 'deliveryAnchorId');
  assertNonEmpty(input.platformDeliveryType, 'platformDeliveryType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.deliveryAnchorId !== input.deliveryAnchorId) {
    return Object.freeze({ ok: false, reason: 'delivery_anchor_id_mismatch' });
  }

  const deliveryState = input.deliveryState ?? 'anchor-recorded';
  const channelScope = input.channelScope?.trim() ?? input.prior?.channelScope ?? null;
  const platformDeliveryType = input.platformDeliveryType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    deliveryAnchorId: input.deliveryAnchorId,
    platformDeliveryType,
    deliveryState,
    channelScope,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      deliveryAnchorId: input.deliveryAnchorId,
      platformDeliveryType,
      deliveryState,
      channelScope,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
