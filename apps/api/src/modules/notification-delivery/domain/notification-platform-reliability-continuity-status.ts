/**
 * W5-N17-c — Process-local Notification Platform Delivery Reliability continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N17-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformReliabilityRecoveryDiagnostics } from './notification-platform-reliability-restart-recovery';
import { W5_N17_C_NOTIFICATION_PLATFORM_RELIABILITY_RECOVERY_OWNER } from './notification-platform-reliability-restart-recovery';

export type NotificationPlatformReliabilityRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformReliabilityOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformReliabilityContinuityRecord = Readonly<{
  owner: typeof W5_N17_C_NOTIFICATION_PLATFORM_RELIABILITY_RECOVERY_OWNER;
  outcome: NotificationPlatformReliabilityRecoveryOutcome;
  ownerReadiness: NotificationPlatformReliabilityOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformReliabilityRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformReliabilityContinuityRecord | null = null;

export function recordNotificationPlatformReliabilityRecoveryStart(
  atMs: number = Date.now(),
): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N17_C_NOTIFICATION_PLATFORM_RELIABILITY_RECOVERY_OWNER,
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

export function recordNotificationPlatformReliabilityRecoverySuccess(input: {
  diagnostics: NotificationPlatformReliabilityRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformReliabilityOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N17_C_NOTIFICATION_PLATFORM_RELIABILITY_RECOVERY_OWNER,
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

export function recordNotificationPlatformReliabilityRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformReliabilityOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N17_C_NOTIFICATION_PLATFORM_RELIABILITY_RECOVERY_OWNER,
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
export function recordNotificationPlatformReliabilityIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformReliabilityRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformReliabilityContinuityRecord(): NotificationPlatformReliabilityContinuityRecord | null {
  return record;
}

export function isNotificationPlatformReliabilityRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformReliabilityContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
