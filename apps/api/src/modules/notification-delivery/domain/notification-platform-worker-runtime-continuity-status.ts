/**
 * W5-N11-c — Process-local Notification Platform Worker Runtime continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N11-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformWorkerRuntimeRecoveryDiagnostics } from './notification-platform-worker-runtime-restart-recovery';
import { W5_N11_C_NOTIFICATION_PLATFORM_WORKER_RUNTIME_RECOVERY_OWNER } from './notification-platform-worker-runtime-restart-recovery';

export type NotificationPlatformWorkerRuntimeRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformWorkerRuntimeOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformWorkerRuntimeContinuityRecord = Readonly<{
  owner: typeof W5_N11_C_NOTIFICATION_PLATFORM_WORKER_RUNTIME_RECOVERY_OWNER;
  outcome: NotificationPlatformWorkerRuntimeRecoveryOutcome;
  ownerReadiness: NotificationPlatformWorkerRuntimeOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformWorkerRuntimeRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformWorkerRuntimeContinuityRecord | null = null;

export function recordNotificationPlatformWorkerRuntimeRecoveryStart(
  atMs: number = Date.now(),
): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N11_C_NOTIFICATION_PLATFORM_WORKER_RUNTIME_RECOVERY_OWNER,
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

export function recordNotificationPlatformWorkerRuntimeRecoverySuccess(input: {
  diagnostics: NotificationPlatformWorkerRuntimeRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformWorkerRuntimeOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N11_C_NOTIFICATION_PLATFORM_WORKER_RUNTIME_RECOVERY_OWNER,
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

export function recordNotificationPlatformWorkerRuntimeRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformWorkerRuntimeOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N11_C_NOTIFICATION_PLATFORM_WORKER_RUNTIME_RECOVERY_OWNER,
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
export function recordNotificationPlatformWorkerRuntimeIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformWorkerRuntimeRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformWorkerRuntimeContinuityRecord(): NotificationPlatformWorkerRuntimeContinuityRecord | null {
  return record;
}

export function isNotificationPlatformWorkerRuntimeRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformWorkerRuntimeContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
