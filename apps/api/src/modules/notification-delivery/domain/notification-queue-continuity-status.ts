/**
 * W3-O02-d — Process-local Notification Durable Queue continuity outcomes.
 *
 * Records hydrate integrity / channel honesty so Operational Continuity can
 * project queue readiness without a second persistence owner or monitoring platform.
 */

import type { NotificationQueueRecoveryDiagnostics } from './notification-queue-restart-recovery';

export type NotificationQueueRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationQueueContinuityRecord = Readonly<{
  owner: 'notification-delivery';
  outcome: NotificationQueueRecoveryOutcome;
  integrityVerified: boolean;
  channelUnavailable: boolean;
  reason?: string;
  diagnostics: NotificationQueueRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let channelUnavailable = false;
let record: NotificationQueueContinuityRecord | null = null;

export function recordNotificationQueueRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: 'notification-delivery',
    outcome: 'unavailable',
    integrityVerified: false,
    channelUnavailable,
    reason: 'recovering',
    diagnostics: null,
    recoveryStartedAt: new Date(atMs).toISOString(),
    recoveryCompletedAt: null,
    recoveryDurationMs: null,
  });
}

export function recordNotificationQueueRecoverySuccess(input: {
  diagnostics: NotificationQueueRecoveryDiagnostics;
  reason?: string;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: 'notification-delivery',
    outcome: 'ready',
    integrityVerified: true,
    channelUnavailable,
    reason: input.reason ?? 'hydrate-ok',
    diagnostics: input.diagnostics,
    recoveryStartedAt: new Date(startedAtMs).toISOString(),
    recoveryCompletedAt: new Date(completedAtMs).toISOString(),
    recoveryDurationMs: Math.max(0, completedAtMs - startedAtMs),
  });
}

export function recordNotificationQueueRecoveryFailure(input: {
  reason: string;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: 'notification-delivery',
    outcome: 'unavailable',
    integrityVerified: false,
    channelUnavailable,
    reason: input.reason,
    diagnostics: null,
    recoveryStartedAt: new Date(startedAtMs).toISOString(),
    recoveryCompletedAt: new Date(completedAtMs).toISOString(),
    recoveryDurationMs: Math.max(0, completedAtMs - startedAtMs),
  });
}

/** Channel-down honesty signal (does not invent Ready delivery). */
export function recordNotificationChannelUnavailable(unavailable: boolean, reason?: string): void {
  channelUnavailable = unavailable;
  if (record) {
    record = Object.freeze({
      ...record,
      channelUnavailable: unavailable,
      reason: reason ?? record.reason,
    });
  }
}

export function getNotificationQueueContinuityRecord(): NotificationQueueContinuityRecord | null {
  return record;
}

export function isNotificationQueueRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationQueueContinuity(): void {
  recoveryStartedAtMs = null;
  channelUnavailable = false;
  record = null;
}
