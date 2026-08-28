/**
 * W5-N01-d — Telegram Notification operational continuity (pure).
 *
 * Operational state is derived from W5-N01-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or delivery labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type TelegramNotificationContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  TelegramNotificationContinuityRecord,
  TelegramNotificationOwnerReadiness,
} from './telegram-notification-continuity-status';
import type { TelegramNotificationRecoveryDiagnostics } from './telegram-notification-restart-recovery';

export type TelegramNotificationOperationalState = OperationalState;
export type TelegramNotificationContinuityProjection = TelegramNotificationContinuityView;

export type EvaluateTelegramNotificationContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: TelegramNotificationOwnerReadiness;
  continuity: TelegramNotificationContinuityRecord | null;
}>;

/**
 * Derive Telegram Notification operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateTelegramNotificationOperationalState(
  input: EvaluateTelegramNotificationContinuityInput,
): TelegramNotificationOperationalState {
  if (input.recovering) {
    return 'Recovering';
  }
  if (input.ownerReadiness === 'unavailable') {
    return 'Unavailable';
  }
  if (input.ownerReadiness === 'degraded') {
    return 'Degraded';
  }
  if (!input.continuity) {
    return 'Unavailable';
  }
  if (input.continuity.outcome === 'unavailable') {
    return 'Unavailable';
  }
  if (input.continuity.integrityFailure) {
    return 'Degraded';
  }
  if (!input.continuity.integrityVerified) {
    return 'Unavailable';
  }
  return 'Ready';
}

export function buildTelegramNotificationContinuityProjection(
  input: EvaluateTelegramNotificationContinuityInput,
): TelegramNotificationContinuityView {
  const operationalState = evaluateTelegramNotificationOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: TelegramNotificationRecoveryDiagnostics | null =
    input.continuity?.diagnostics ?? null;

  return Object.freeze({
    operationalState,
    ownerReadiness: input.ownerReadiness,
    recoveryTimestamp: input.continuity?.recoveryCompletedAt ?? null,
    recoveryDurationMs: input.continuity?.recoveryDurationMs ?? null,
    reason: input.continuity?.reason,
    restoredCount: diagnostics?.restoredCount ?? 0,
    canonicalAnchorCount: diagnostics?.canonicalAnchorCount ?? 0,
    integrityVerified: input.continuity?.integrityVerified ?? false,
    workspaceIds: diagnostics?.workspaceIds ?? Object.freeze([]),
  });
}

/**
 * Graceful degradation: Telegram Notification continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function telegramNotificationContinuesWhileOthersDegraded(input: {
  telegramNotificationState: TelegramNotificationOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.telegramNotificationState === 'Unavailable') {
    return false;
  }
  if (
    input.telegramNotificationState !== 'Ready' &&
    input.telegramNotificationState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
