export const EMAIL_NOTIFICATION_ANCHOR_SCHEMA_VERSION = 1;

export const EMAIL_NOTIFICATION_ANCHOR_DELIVERY_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type EmailNotificationAnchorDeliveryState =
  (typeof EMAIL_NOTIFICATION_ANCHOR_DELIVERY_STATES)[number];

export type DurableEmailNotificationAnchor = Readonly<{
  workspaceId: string;
  notificationId: string;
  notificationChannel: string;
  notificationType: string;
  recipientIdentifier: string | null;
  templateIdentifier: string | null;
  deliveryState: EmailNotificationAnchorDeliveryState;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type EmailNotificationAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableEmailNotificationAnchor }>
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
  deliveryState: EmailNotificationAnchorDeliveryState;
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
 * Build durable Email notification anchor for persistence (W5-N02-b).
 * Stores canonical notification anchors only — not SMTP transport or outbound delivery.
 */
export function buildEmailNotificationAnchorState(input: {
  workspaceId: string;
  notificationId: string;
  notificationChannel: string;
  notificationType: string;
  recipientIdentifier?: string | null;
  templateIdentifier?: string | null;
  deliveryState?: EmailNotificationAnchorDeliveryState;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableEmailNotificationAnchor | null;
}): EmailNotificationAnchorPersistenceOutcome {
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

  const notificationChannel = input.notificationChannel.trim().toLowerCase();
  if (notificationChannel !== 'email') {
    return Object.freeze({ ok: false, reason: 'notification_channel_must_be_email' });
  }

  const deliveryState = input.deliveryState ?? 'anchor-recorded';
  const recipientIdentifier =
    input.recipientIdentifier?.trim() ?? input.prior?.recipientIdentifier ?? null;
  const templateIdentifier =
    input.templateIdentifier?.trim() ?? input.prior?.templateIdentifier ?? null;
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
    schemaVersion: EMAIL_NOTIFICATION_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
