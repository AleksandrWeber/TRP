/**
 * W5-N07-c — Process-local Notification Platform Dispatch continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N07-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformDispatchRecoveryDiagnostics } from './notification-platform-dispatch-restart-recovery';
import { W5_N07_C_NOTIFICATION_PLATFORM_DISPATCH_RECOVERY_OWNER } from './notification-platform-dispatch-restart-recovery';

export type NotificationPlatformDispatchRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformDispatchOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformDispatchContinuityRecord = Readonly<{
  owner: typeof W5_N07_C_NOTIFICATION_PLATFORM_DISPATCH_RECOVERY_OWNER;
  outcome: NotificationPlatformDispatchRecoveryOutcome;
  ownerReadiness: NotificationPlatformDispatchOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformDispatchRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformDispatchContinuityRecord | null = null;

export function recordNotificationPlatformDispatchRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N07_C_NOTIFICATION_PLATFORM_DISPATCH_RECOVERY_OWNER,
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

export function recordNotificationPlatformDispatchRecoverySuccess(input: {
  diagnostics: NotificationPlatformDispatchRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformDispatchOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N07_C_NOTIFICATION_PLATFORM_DISPATCH_RECOVERY_OWNER,
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

export function recordNotificationPlatformDispatchRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformDispatchOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N07_C_NOTIFICATION_PLATFORM_DISPATCH_RECOVERY_OWNER,
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
export function recordNotificationPlatformDispatchIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformDispatchRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformDispatchContinuityRecord(): NotificationPlatformDispatchContinuityRecord | null {
  return record;
}

export function isNotificationPlatformDispatchRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformDispatchContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
