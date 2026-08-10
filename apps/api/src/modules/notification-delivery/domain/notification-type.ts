/**
 * RC-24 Epic 6 — Notification type catalog + criticality.
 *
 * Independent per-type delivery preferences. Optional noisy types default disabled.
 */

export const NOTIFICATION_TYPES = Object.freeze([
  'daily-report',
  'weekly-report',
  'monthly-report',
  'session-finished',
  'strategy-certified',
  'strategy-deprecated',
  'runtime-validation-failed',
  'emergency-stop',
  'kill-switch-activated',
  'critical-platform-error',
  'order-events',
  'fill-events',
  'debug-events',
] as const);

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Optional / noisy types — disabled by default. */
export const OPTIONAL_NOTIFICATION_TYPES = Object.freeze([
  'order-events',
  'fill-events',
  'debug-events',
] as const);

export type OptionalNotificationType = (typeof OPTIONAL_NOTIFICATION_TYPES)[number];

/** Types treated as critical for quiet-hours bypass defaults. */
export const CRITICAL_NOTIFICATION_TYPES = Object.freeze([
  'runtime-validation-failed',
  'emergency-stop',
  'kill-switch-activated',
  'critical-platform-error',
] as const);

export type CriticalNotificationType = (typeof CRITICAL_NOTIFICATION_TYPES)[number];

export function isNotificationType(value: string): value is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export function isOptionalNotificationType(value: string): value is OptionalNotificationType {
  return (OPTIONAL_NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export function isCriticalNotificationType(value: string): value is CriticalNotificationType {
  return (CRITICAL_NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export function defaultEnabledForType(type: NotificationType): boolean {
  return !isOptionalNotificationType(type);
}
