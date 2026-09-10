/**
 * W5-N18-c — Process-local Notification Platform Retry Execution continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N18-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformRetryExecutionRecoveryDiagnostics } from './notification-platform-retry-execution-restart-recovery';
import { W5_N18_C_NOTIFICATION_PLATFORM_RETRY_EXECUTION_RECOVERY_OWNER } from './notification-platform-retry-execution-restart-recovery';

export type NotificationPlatformRetryExecutionRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformRetryExecutionOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformRetryExecutionContinuityRecord = Readonly<{
  owner: typeof W5_N18_C_NOTIFICATION_PLATFORM_RETRY_EXECUTION_RECOVERY_OWNER;
  outcome: NotificationPlatformRetryExecutionRecoveryOutcome;
  ownerReadiness: NotificationPlatformRetryExecutionOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformRetryExecutionRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformRetryExecutionContinuityRecord | null = null;

export function recordNotificationPlatformRetryExecutionRecoveryStart(
  atMs: number = Date.now(),
): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N18_C_NOTIFICATION_PLATFORM_RETRY_EXECUTION_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetryExecutionRecoverySuccess(input: {
  diagnostics: NotificationPlatformRetryExecutionRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformRetryExecutionOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N18_C_NOTIFICATION_PLATFORM_RETRY_EXECUTION_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetryExecutionRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformRetryExecutionOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N18_C_NOTIFICATION_PLATFORM_RETRY_EXECUTION_RECOVERY_OWNER,
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
export function recordNotificationPlatformRetryExecutionIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformRetryExecutionRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformRetryExecutionContinuityRecord(): NotificationPlatformRetryExecutionContinuityRecord | null {
  return record;
}

export function isNotificationPlatformRetryExecutionRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformRetryExecutionContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
