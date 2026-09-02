/**
 * W5-N15-c — Process-local Notification Platform Telemetry continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N15-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformTelemetryRecoveryDiagnostics } from './notification-platform-telemetry-restart-recovery';
import { W5_N15_C_NOTIFICATION_PLATFORM_TELEMETRY_RECOVERY_OWNER } from './notification-platform-telemetry-restart-recovery';

export type NotificationPlatformTelemetryRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformTelemetryOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformTelemetryContinuityRecord = Readonly<{
  owner: typeof W5_N15_C_NOTIFICATION_PLATFORM_TELEMETRY_RECOVERY_OWNER;
  outcome: NotificationPlatformTelemetryRecoveryOutcome;
  ownerReadiness: NotificationPlatformTelemetryOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformTelemetryRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformTelemetryContinuityRecord | null = null;

export function recordNotificationPlatformTelemetryRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N15_C_NOTIFICATION_PLATFORM_TELEMETRY_RECOVERY_OWNER,
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

export function recordNotificationPlatformTelemetryRecoverySuccess(input: {
  diagnostics: NotificationPlatformTelemetryRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformTelemetryOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N15_C_NOTIFICATION_PLATFORM_TELEMETRY_RECOVERY_OWNER,
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

export function recordNotificationPlatformTelemetryRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformTelemetryOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N15_C_NOTIFICATION_PLATFORM_TELEMETRY_RECOVERY_OWNER,
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
export function recordNotificationPlatformTelemetryIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformTelemetryRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformTelemetryContinuityRecord(): NotificationPlatformTelemetryContinuityRecord | null {
  return record;
}

export function isNotificationPlatformTelemetryRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformTelemetryContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
