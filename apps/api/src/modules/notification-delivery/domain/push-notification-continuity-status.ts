/**
 * W5-N04-c — Process-local Push Notification continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N04-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { PushNotificationRecoveryDiagnostics } from './push-notification-restart-recovery';
import { W5_N04_C_PUSH_NOTIFICATION_RECOVERY_OWNER } from './push-notification-restart-recovery';

export type PushNotificationRecoveryOutcome = 'ready' | 'unavailable';

export type PushNotificationOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type PushNotificationContinuityRecord = Readonly<{
  owner: typeof W5_N04_C_PUSH_NOTIFICATION_RECOVERY_OWNER;
  outcome: PushNotificationRecoveryOutcome;
  ownerReadiness: PushNotificationOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: PushNotificationRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: PushNotificationContinuityRecord | null = null;

export function recordPushNotificationRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N04_C_PUSH_NOTIFICATION_RECOVERY_OWNER,
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

export function recordPushNotificationRecoverySuccess(input: {
  diagnostics: PushNotificationRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: PushNotificationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N04_C_PUSH_NOTIFICATION_RECOVERY_OWNER,
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

export function recordPushNotificationRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: PushNotificationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N04_C_PUSH_NOTIFICATION_RECOVERY_OWNER,
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
export function recordPushNotificationIntegrityFailure(reason: string): void {
  if (!record) {
    recordPushNotificationRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getPushNotificationContinuityRecord(): PushNotificationContinuityRecord | null {
  return record;
}

export function isPushNotificationRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetPushNotificationContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
