/**
 * W5-N23-c — Process-local Notification Platform Notification Retry Eligibility continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N23-d) can project readiness
 * without a second persistence owner or recovery engine.
 * Not Platform Readiness product. Not eligibility evaluation runtime. Not scheduling/execution.
 */

import type { NotificationPlatformRetryEligibilityRecoveryDiagnostics } from './notification-platform-retry-eligibility-restart-recovery';
import { W5_N23_C_NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_RECOVERY_OWNER } from './notification-platform-retry-eligibility-restart-recovery';

export type NotificationPlatformRetryEligibilityRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformRetryEligibilityOwnerReadiness =
  'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformRetryEligibilityContinuityRecord = Readonly<{
  owner: typeof W5_N23_C_NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_RECOVERY_OWNER;
  outcome: NotificationPlatformRetryEligibilityRecoveryOutcome;
  ownerReadiness: NotificationPlatformRetryEligibilityOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformRetryEligibilityRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformRetryEligibilityContinuityRecord | null = null;

export function recordNotificationPlatformRetryEligibilityRecoveryStart(
  atMs: number = Date.now(),
): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N23_C_NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetryEligibilityRecoverySuccess(input: {
  diagnostics: NotificationPlatformRetryEligibilityRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformRetryEligibilityOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N23_C_NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetryEligibilityRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformRetryEligibilityOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N23_C_NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_RECOVERY_OWNER,
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
export function recordNotificationPlatformRetryEligibilityIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformRetryEligibilityRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformRetryEligibilityContinuityRecord(): NotificationPlatformRetryEligibilityContinuityRecord | null {
  return record;
}

export function isNotificationPlatformRetryEligibilityRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformRetryEligibilityContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
