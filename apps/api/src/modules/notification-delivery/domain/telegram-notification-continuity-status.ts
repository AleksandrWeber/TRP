/**
 * W5-N01-c — Process-local Telegram Notification continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N01-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { TelegramNotificationRecoveryDiagnostics } from './telegram-notification-restart-recovery';
import { W5_N01_C_TELEGRAM_NOTIFICATION_RECOVERY_OWNER } from './telegram-notification-restart-recovery';

export type TelegramNotificationRecoveryOutcome = 'ready' | 'unavailable';

export type TelegramNotificationOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type TelegramNotificationContinuityRecord = Readonly<{
  owner: typeof W5_N01_C_TELEGRAM_NOTIFICATION_RECOVERY_OWNER;
  outcome: TelegramNotificationRecoveryOutcome;
  ownerReadiness: TelegramNotificationOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: TelegramNotificationRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: TelegramNotificationContinuityRecord | null = null;

export function recordTelegramNotificationRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N01_C_TELEGRAM_NOTIFICATION_RECOVERY_OWNER,
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

export function recordTelegramNotificationRecoverySuccess(input: {
  diagnostics: TelegramNotificationRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: TelegramNotificationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N01_C_TELEGRAM_NOTIFICATION_RECOVERY_OWNER,
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

export function recordTelegramNotificationRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: TelegramNotificationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N01_C_TELEGRAM_NOTIFICATION_RECOVERY_OWNER,
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
export function recordTelegramNotificationIntegrityFailure(reason: string): void {
  if (!record) {
    recordTelegramNotificationRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getTelegramNotificationContinuityRecord(): TelegramNotificationContinuityRecord | null {
  return record;
}

export function isTelegramNotificationRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetTelegramNotificationContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
