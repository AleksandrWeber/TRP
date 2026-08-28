export const TELEGRAM_NOTIFICATION_ANCHOR_SCHEMA_VERSION = 1;

export const TELEGRAM_NOTIFICATION_ANCHOR_DELIVERY_STATES = Object.freeze([
  'anchor-recorded',
  'pending-delivery',
  'delivery-attempted',
] as const);

export type TelegramNotificationAnchorDeliveryState =
  (typeof TELEGRAM_NOTIFICATION_ANCHOR_DELIVERY_STATES)[number];

export type DurableTelegramNotificationAnchor = Readonly<{
  workspaceId: string;
  notificationId: string;
  notificationChannel: string;
  notificationType: string;
  recipientIdentifier: string | null;
  templateIdentifier: string | null;
  deliveryState: TelegramNotificationAnchorDeliveryState;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type TelegramNotificationAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableTelegramNotificationAnchor }>
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
  notificationId: string;
  notificationChannel: string;
  notificationType: string;
  recipientIdentifier: string | null;
  templateIdentifier: string | null;
  deliveryState: TelegramNotificationAnchorDeliveryState;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    notificationId: input.notificationId,
    notificationChannel: input.notificationChannel,
    notificationType: input.notificationType,
    recipientIdentifier: input.recipientIdentifier,
    templateIdentifier: input.templateIdentifier,
    deliveryState: input.deliveryState,
  });
}

/**
 * Build durable Telegram notification anchor for persistence (W5-N01-b).
 * Stores canonical notification anchors only — not delivery execution or Bot API I/O.
 */
export function buildTelegramNotificationAnchorState(input: {
  workspaceId: string;
  notificationId: string;
  notificationChannel: string;
  notificationType: string;
  recipientIdentifier?: string | null;
  templateIdentifier?: string | null;
  deliveryState?: TelegramNotificationAnchorDeliveryState;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableTelegramNotificationAnchor | null;
}): TelegramNotificationAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.notificationId, 'notificationId');
  assertNonEmpty(input.notificationChannel, 'notificationChannel');
  assertNonEmpty(input.notificationType, 'notificationType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.notificationId !== input.notificationId) {
    return Object.freeze({ ok: false, reason: 'notification_id_mismatch' });
  }

  const deliveryState = input.deliveryState ?? 'anchor-recorded';
  const recipientIdentifier =
    input.recipientIdentifier?.trim() ?? input.prior?.recipientIdentifier ?? null;
  const templateIdentifier =
    input.templateIdentifier?.trim() ?? input.prior?.templateIdentifier ?? null;
  const notificationChannel = input.notificationChannel.trim().toLowerCase();
  const notificationType = input.notificationType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    notificationId: input.notificationId,
    notificationChannel,
    notificationType,
    recipientIdentifier,
    templateIdentifier,
    deliveryState,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      notificationId: input.notificationId,
      notificationChannel,
      notificationType,
      recipientIdentifier,
      templateIdentifier,
      deliveryState,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: TELEGRAM_NOTIFICATION_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
