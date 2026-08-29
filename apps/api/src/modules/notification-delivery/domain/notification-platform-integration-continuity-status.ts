/**
 * W5-N05-c — Process-local Notification Platform Integration continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N05-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformIntegrationRecoveryDiagnostics } from './notification-platform-integration-restart-recovery';
import { W5_N05_C_NOTIFICATION_PLATFORM_INTEGRATION_RECOVERY_OWNER } from './notification-platform-integration-restart-recovery';

export type NotificationPlatformIntegrationRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformIntegrationOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformIntegrationContinuityRecord = Readonly<{
  owner: typeof W5_N05_C_NOTIFICATION_PLATFORM_INTEGRATION_RECOVERY_OWNER;
  outcome: NotificationPlatformIntegrationRecoveryOutcome;
  ownerReadiness: NotificationPlatformIntegrationOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformIntegrationRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformIntegrationContinuityRecord | null = null;

export function recordNotificationPlatformIntegrationRecoveryStart(
  atMs: number = Date.now(),
): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N05_C_NOTIFICATION_PLATFORM_INTEGRATION_RECOVERY_OWNER,
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

export function recordNotificationPlatformIntegrationRecoverySuccess(input: {
  diagnostics: NotificationPlatformIntegrationRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformIntegrationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N05_C_NOTIFICATION_PLATFORM_INTEGRATION_RECOVERY_OWNER,
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

export function recordNotificationPlatformIntegrationRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformIntegrationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N05_C_NOTIFICATION_PLATFORM_INTEGRATION_RECOVERY_OWNER,
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
export function recordNotificationPlatformIntegrationIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformIntegrationRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformIntegrationContinuityRecord(): NotificationPlatformIntegrationContinuityRecord | null {
  return record;
}

export function isNotificationPlatformIntegrationRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformIntegrationContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
