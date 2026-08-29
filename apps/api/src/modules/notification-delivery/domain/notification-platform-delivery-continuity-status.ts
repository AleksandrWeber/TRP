/**
 * W5-N06-c — Process-local Notification Platform Delivery continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N06-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformDeliveryRecoveryDiagnostics } from './notification-platform-delivery-restart-recovery';
import { W5_N06_C_NOTIFICATION_PLATFORM_DELIVERY_RECOVERY_OWNER } from './notification-platform-delivery-restart-recovery';

export type NotificationPlatformDeliveryRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformDeliveryOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformDeliveryContinuityRecord = Readonly<{
  owner: typeof W5_N06_C_NOTIFICATION_PLATFORM_DELIVERY_RECOVERY_OWNER;
  outcome: NotificationPlatformDeliveryRecoveryOutcome;
  ownerReadiness: NotificationPlatformDeliveryOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformDeliveryRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformDeliveryContinuityRecord | null = null;

export function recordNotificationPlatformDeliveryRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N06_C_NOTIFICATION_PLATFORM_DELIVERY_RECOVERY_OWNER,
    outcome: 'unavailable',
    ownerReadiness: 'ready',
    integrityVerified: false,
    integrityFailure: false,
    reason: 'recovering',
    diagnostics: null,
    recoveryStartedAt: new Date(atMs).toISOString(),
    recoveryCompletedAt: null,
    recoveryDurationMs: null,
  });
}

export function recordNotificationPlatformDeliveryRecoverySuccess(input: {
  diagnostics: NotificationPlatformDeliveryRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformDeliveryOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N06_C_NOTIFICATION_PLATFORM_DELIVERY_RECOVERY_OWNER,
    outcome: 'ready',
    ownerReadiness: input.ownerReadiness ?? 'ready',
    integrityVerified: true,
    integrityFailure: false,
    reason: input.reason ?? 'hydrate-ok',
    diagnostics: input.diagnostics,
    recoveryStartedAt: new Date(startedAtMs).toISOString(),
    recoveryCompletedAt: new Date(completedAtMs).toISOString(),
    recoveryDurationMs: Math.max(0, completedAtMs - startedAtMs),
  });
}

export function recordNotificationPlatformDeliveryRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformDeliveryOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N06_C_NOTIFICATION_PLATFORM_DELIVERY_RECOVERY_OWNER,
    outcome: 'unavailable',
    ownerReadiness: input.ownerReadiness ?? 'unavailable',
    integrityVerified: false,
    integrityFailure: false,
    reason: input.reason,
    diagnostics: null,
    recoveryStartedAt: new Date(startedAtMs).toISOString(),
    recoveryCompletedAt: new Date(completedAtMs).toISOString(),
    recoveryDurationMs: Math.max(0, completedAtMs - startedAtMs),
  });
}

/** Integrity failure honesty — Degraded, never fabricates Ready. */
export function recordNotificationPlatformDeliveryIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformDeliveryRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformDeliveryContinuityRecord(): NotificationPlatformDeliveryContinuityRecord | null {
  return record;
}

export function isNotificationPlatformDeliveryRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformDeliveryContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
