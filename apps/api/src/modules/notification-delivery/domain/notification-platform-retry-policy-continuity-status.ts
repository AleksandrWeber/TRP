/**
 * W5-N20-c — Process-local Notification Platform Retry Policy continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N20-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformRetryPolicyRecoveryDiagnostics } from './notification-platform-retry-policy-restart-recovery';
import { W5_N20_C_NOTIFICATION_PLATFORM_RETRY_POLICY_RECOVERY_OWNER } from './notification-platform-retry-policy-restart-recovery';

export type NotificationPlatformRetryPolicyRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformRetryPolicyOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformRetryPolicyContinuityRecord = Readonly<{
  owner: typeof W5_N20_C_NOTIFICATION_PLATFORM_RETRY_POLICY_RECOVERY_OWNER;
  outcome: NotificationPlatformRetryPolicyRecoveryOutcome;
  ownerReadiness: NotificationPlatformRetryPolicyOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformRetryPolicyRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformRetryPolicyContinuityRecord | null = null;

export function recordNotificationPlatformRetryPolicyRecoveryStart(
  atMs: number = Date.now(),
): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N20_C_NOTIFICATION_PLATFORM_RETRY_POLICY_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetryPolicyRecoverySuccess(input: {
  diagnostics: NotificationPlatformRetryPolicyRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformRetryPolicyOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N20_C_NOTIFICATION_PLATFORM_RETRY_POLICY_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetryPolicyRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformRetryPolicyOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N20_C_NOTIFICATION_PLATFORM_RETRY_POLICY_RECOVERY_OWNER,
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
export function recordNotificationPlatformRetryPolicyIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformRetryPolicyRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformRetryPolicyContinuityRecord(): NotificationPlatformRetryPolicyContinuityRecord | null {
  return record;
}

export function isNotificationPlatformRetryPolicyRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformRetryPolicyContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
