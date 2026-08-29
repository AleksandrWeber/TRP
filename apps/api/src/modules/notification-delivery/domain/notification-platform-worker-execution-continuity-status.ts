/**
 * W5-N10-c — Process-local Notification Platform Worker Execution continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N10-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformWorkerExecutionRecoveryDiagnostics } from './notification-platform-worker-execution-restart-recovery';
import { W5_N10_C_NOTIFICATION_PLATFORM_WORKER_EXECUTION_RECOVERY_OWNER } from './notification-platform-worker-execution-restart-recovery';

export type NotificationPlatformWorkerExecutionRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformWorkerExecutionOwnerReadiness =
  'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformWorkerExecutionContinuityRecord = Readonly<{
  owner: typeof W5_N10_C_NOTIFICATION_PLATFORM_WORKER_EXECUTION_RECOVERY_OWNER;
  outcome: NotificationPlatformWorkerExecutionRecoveryOutcome;
  ownerReadiness: NotificationPlatformWorkerExecutionOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformWorkerExecutionRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformWorkerExecutionContinuityRecord | null = null;

export function recordNotificationPlatformWorkerExecutionRecoveryStart(
  atMs: number = Date.now(),
): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N10_C_NOTIFICATION_PLATFORM_WORKER_EXECUTION_RECOVERY_OWNER,
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

export function recordNotificationPlatformWorkerExecutionRecoverySuccess(input: {
  diagnostics: NotificationPlatformWorkerExecutionRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformWorkerExecutionOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N10_C_NOTIFICATION_PLATFORM_WORKER_EXECUTION_RECOVERY_OWNER,
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

export function recordNotificationPlatformWorkerExecutionRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformWorkerExecutionOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N10_C_NOTIFICATION_PLATFORM_WORKER_EXECUTION_RECOVERY_OWNER,
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
export function recordNotificationPlatformWorkerExecutionIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformWorkerExecutionRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformWorkerExecutionContinuityRecord(): NotificationPlatformWorkerExecutionContinuityRecord | null {
  return record;
}

export function isNotificationPlatformWorkerExecutionRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformWorkerExecutionContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
