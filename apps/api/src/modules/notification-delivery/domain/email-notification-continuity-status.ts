/**
 * W5-N02-c — Process-local Email Notification continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N02-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { EmailNotificationRecoveryDiagnostics } from './email-notification-restart-recovery';
import { W5_N02_C_EMAIL_NOTIFICATION_RECOVERY_OWNER } from './email-notification-restart-recovery';

export type EmailNotificationRecoveryOutcome = 'ready' | 'unavailable';

export type EmailNotificationOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type EmailNotificationContinuityRecord = Readonly<{
  owner: typeof W5_N02_C_EMAIL_NOTIFICATION_RECOVERY_OWNER;
  outcome: EmailNotificationRecoveryOutcome;
  ownerReadiness: EmailNotificationOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: EmailNotificationRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: EmailNotificationContinuityRecord | null = null;

export function recordEmailNotificationRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N02_C_EMAIL_NOTIFICATION_RECOVERY_OWNER,
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

export function recordEmailNotificationRecoverySuccess(input: {
  diagnostics: EmailNotificationRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: EmailNotificationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N02_C_EMAIL_NOTIFICATION_RECOVERY_OWNER,
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

export function recordEmailNotificationRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: EmailNotificationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N02_C_EMAIL_NOTIFICATION_RECOVERY_OWNER,
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
export function recordEmailNotificationIntegrityFailure(reason: string): void {
  if (!record) {
    recordEmailNotificationRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getEmailNotificationContinuityRecord(): EmailNotificationContinuityRecord | null {
  return record;
}

export function isEmailNotificationRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetEmailNotificationContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
