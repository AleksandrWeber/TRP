/**
 * W5-N22-c — Process-local Notification Platform Retry Backoff Calculation continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N22-d) can project readiness
 * without a second persistence owner or recovery engine.
 * Not Platform Readiness product. Not calculation runtime. Not scheduling/execution.
 */

import type { NotificationPlatformRetryBackoffCalculationRecoveryDiagnostics } from './notification-platform-retry-backoff-calculation-restart-recovery';
import { W5_N22_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_RECOVERY_OWNER } from './notification-platform-retry-backoff-calculation-restart-recovery';

export type NotificationPlatformRetryBackoffCalculationRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformRetryBackoffCalculationOwnerReadiness =
  'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformRetryBackoffCalculationContinuityRecord = Readonly<{
  owner: typeof W5_N22_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_RECOVERY_OWNER;
  outcome: NotificationPlatformRetryBackoffCalculationRecoveryOutcome;
  ownerReadiness: NotificationPlatformRetryBackoffCalculationOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformRetryBackoffCalculationRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformRetryBackoffCalculationContinuityRecord | null = null;

export function recordNotificationPlatformRetryBackoffCalculationRecoveryStart(
  atMs: number = Date.now(),
): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N22_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetryBackoffCalculationRecoverySuccess(input: {
  diagnostics: NotificationPlatformRetryBackoffCalculationRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformRetryBackoffCalculationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N22_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetryBackoffCalculationRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformRetryBackoffCalculationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N22_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_RECOVERY_OWNER,
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
export function recordNotificationPlatformRetryBackoffCalculationIntegrityFailure(
  reason: string,
): void {
  if (!record) {
    recordNotificationPlatformRetryBackoffCalculationRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformRetryBackoffCalculationContinuityRecord(): NotificationPlatformRetryBackoffCalculationContinuityRecord | null {
  return record;
}

export function isNotificationPlatformRetryBackoffCalculationRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformRetryBackoffCalculationContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
