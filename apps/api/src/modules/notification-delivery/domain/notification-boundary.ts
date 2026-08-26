/**
 * RC-24 Epic 6 — Notification Delivery boundary + ownership invariants.
 *
 * Authority Matrix: Telegram / channel messages = Notification projection.
 * Spec v2.0 §5.16 — Telegram is notification projection only, never a control plane.
 *
 * Delivery only. Never generates reports, never owns business state,
 * never becomes Source of Truth, never controls Trading Runtime,
 * never communicates with Strategy Library.
 */

/** Authority Matrix class for channel delivery messages. */
export const NOTIFICATION_DELIVERY_AUTHORITY_CLASS = 'notification-projection' as const;

export const NOTIFICATION_DELIVERY_MODULE_ID = 'notification-delivery' as const;

export const NOTIFICATION_DELIVERY_OWNED_CONCERNS = Object.freeze([
  'notification-delivery-boundary',
  'notification-channel',
  'user-notification-preferences',
  'telegram-connection',
  'delivery-routing',
] as const);

export type NotificationDeliveryOwnedConcern =
  (typeof NOTIFICATION_DELIVERY_OWNED_CONCERNS)[number];

export const NOTIFICATION_DELIVERY_NON_OWNED = Object.freeze([
  'report-generation',
  'analytical-narrative',
  'knowledge-lake',
  'trading-session',
  'strategy-library',
  'runtime-enforcement',
  'orders',
  'risk-engine',
  'execution-engine',
  'ledger',
  'trading-orchestrator',
  'strategy-selection',
  'business-decisions',
] as const);

export const NOTIFICATION_DELIVERY_DISTINCT_FROM = Object.freeze([
  'reporting',
  'ai-analytics',
  'knowledge-lake',
  'runtime-enforcement',
  'strategy-library',
  'trading-session',
  'bot-facade',
  'command-center',
] as const);

/** Forbidden control-plane / SoT capabilities (Spec §5.16 + §10). */
export const NOTIFICATION_DELIVERY_FORBIDDEN_CAPABILITIES = Object.freeze([
  'generate-reports',
  'generate-narratives',
  'execute-trades',
  'approve-trades',
  'pause-trading',
  'resume-trading',
  'stop-trading',
  'kill-switch-control',
  'mutate-orders',
  'mutate-session',
  'certify-strategy',
  'deprecate-strategy',
  'manage-strategy-library',
  'control-runtime',
  'become-source-of-truth',
  'telegram-trading-commands',
  'telegram-control-plane',
] as const);

export type NotificationDeliveryForbiddenCapability =
  (typeof NOTIFICATION_DELIVERY_FORBIDDEN_CAPABILITIES)[number];

export type NotificationDeliveryBoundary = Readonly<{
  moduleId: typeof NOTIFICATION_DELIVERY_MODULE_ID;
  authorityClass: typeof NOTIFICATION_DELIVERY_AUTHORITY_CLASS;
  ownedConcerns: typeof NOTIFICATION_DELIVERY_OWNED_CONCERNS;
  nonOwned: typeof NOTIFICATION_DELIVERY_NON_OWNED;
  distinctFrom: typeof NOTIFICATION_DELIVERY_DISTINCT_FROM;
  forbiddenCapabilities: typeof NOTIFICATION_DELIVERY_FORBIDDEN_CAPABILITIES;
  activePorts: Readonly<{
    notificationService: true;
    telegramChannel: true;
    emailChannel: false;
    slackChannel: false;
    discordChannel: false;
    teamsChannel: false;
    pushChannel: false;
    persistence: true;
    rest: false;
    schedulerProduct: false;
  }>;
  reportingRole: 'delivery-consumer-only';
  sourceOfTruth: false;
}>;

export const NOTIFICATION_DELIVERY_BOUNDARY: NotificationDeliveryBoundary = Object.freeze({
  moduleId: NOTIFICATION_DELIVERY_MODULE_ID,
  authorityClass: NOTIFICATION_DELIVERY_AUTHORITY_CLASS,
  ownedConcerns: NOTIFICATION_DELIVERY_OWNED_CONCERNS,
  nonOwned: NOTIFICATION_DELIVERY_NON_OWNED,
  distinctFrom: NOTIFICATION_DELIVERY_DISTINCT_FROM,
  forbiddenCapabilities: NOTIFICATION_DELIVERY_FORBIDDEN_CAPABILITIES,
  activePorts: Object.freeze({
    notificationService: true,
    telegramChannel: true,
    emailChannel: false,
    slackChannel: false,
    discordChannel: false,
    teamsChannel: false,
    pushChannel: false,
    persistence: true,
    rest: false,
    schedulerProduct: false,
  }),
  reportingRole: 'delivery-consumer-only',
  sourceOfTruth: false,
});

export function isNotificationDeliveryForbiddenCapability(
  value: string,
): value is NotificationDeliveryForbiddenCapability {
  return (NOTIFICATION_DELIVERY_FORBIDDEN_CAPABILITIES as readonly string[]).includes(value);
}

export function notificationDeliveryIsSourceOfTruth(): false {
  return false;
}

export function notificationDeliveryGeneratesReports(): false {
  return false;
}

export function notificationDeliveryControlsRuntime(): false {
  return false;
}

export function notificationDeliveryTalksToStrategyLibrary(): false {
  return false;
}

export function notificationDeliveryIsTelegramControlPlane(): false {
  return false;
}
