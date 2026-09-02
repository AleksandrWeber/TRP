/**
 * W5-N14-c — Process-local Notification Platform Dead Letter continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N14-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformDeadLetterRecoveryDiagnostics } from './notification-platform-dead-letter-restart-recovery';
import { W5_N14_C_NOTIFICATION_PLATFORM_DEAD_LETTER_RECOVERY_OWNER } from './notification-platform-dead-letter-restart-recovery';

export type NotificationPlatformDeadLetterRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformDeadLetterOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformDeadLetterContinuityRecord = Readonly<{
  owner: typeof W5_N14_C_NOTIFICATION_PLATFORM_DEAD_LETTER_RECOVERY_OWNER;
  outcome: NotificationPlatformDeadLetterRecoveryOutcome;
  ownerReadiness: NotificationPlatformDeadLetterOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformDeadLetterRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformDeadLetterContinuityRecord | null = null;

export function recordNotificationPlatformDeadLetterRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N14_C_NOTIFICATION_PLATFORM_DEAD_LETTER_RECOVERY_OWNER,
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

export function recordNotificationPlatformDeadLetterRecoverySuccess(input: {
  diagnostics: NotificationPlatformDeadLetterRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformDeadLetterOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N14_C_NOTIFICATION_PLATFORM_DEAD_LETTER_RECOVERY_OWNER,
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

export function recordNotificationPlatformDeadLetterRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformDeadLetterOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N14_C_NOTIFICATION_PLATFORM_DEAD_LETTER_RECOVERY_OWNER,
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
export function recordNotificationPlatformDeadLetterIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformDeadLetterRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformDeadLetterContinuityRecord(): NotificationPlatformDeadLetterContinuityRecord | null {
  return record;
}

export function isNotificationPlatformDeadLetterRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformDeadLetterContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
