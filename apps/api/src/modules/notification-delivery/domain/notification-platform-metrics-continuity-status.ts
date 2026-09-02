/**
 * W5-N16-c — Process-local Notification Platform Metrics continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N16-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformMetricsRecoveryDiagnostics } from './notification-platform-metrics-restart-recovery';
import { W5_N16_C_NOTIFICATION_PLATFORM_METRICS_RECOVERY_OWNER } from './notification-platform-metrics-restart-recovery';

export type NotificationPlatformMetricsRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformMetricsOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformMetricsContinuityRecord = Readonly<{
  owner: typeof W5_N16_C_NOTIFICATION_PLATFORM_METRICS_RECOVERY_OWNER;
  outcome: NotificationPlatformMetricsRecoveryOutcome;
  ownerReadiness: NotificationPlatformMetricsOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformMetricsRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformMetricsContinuityRecord | null = null;

export function recordNotificationPlatformMetricsRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N16_C_NOTIFICATION_PLATFORM_METRICS_RECOVERY_OWNER,
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

export function recordNotificationPlatformMetricsRecoverySuccess(input: {
  diagnostics: NotificationPlatformMetricsRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformMetricsOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N16_C_NOTIFICATION_PLATFORM_METRICS_RECOVERY_OWNER,
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

export function recordNotificationPlatformMetricsRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformMetricsOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N16_C_NOTIFICATION_PLATFORM_METRICS_RECOVERY_OWNER,
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
export function recordNotificationPlatformMetricsIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformMetricsRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformMetricsContinuityRecord(): NotificationPlatformMetricsContinuityRecord | null {
  return record;
}

export function isNotificationPlatformMetricsRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformMetricsContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
