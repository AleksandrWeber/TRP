/**
 * W5-N02-d — Email Notification operational continuity (pure).
 *
 * Operational state is derived from W5-N02-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or delivery labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type EmailNotificationContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  EmailNotificationContinuityRecord,
  EmailNotificationOwnerReadiness,
} from './email-notification-continuity-status';
import type { EmailNotificationRecoveryDiagnostics } from './email-notification-restart-recovery';

export type EmailNotificationOperationalState = OperationalState;
export type EmailNotificationContinuityProjection = EmailNotificationContinuityView;

export type EvaluateEmailNotificationContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: EmailNotificationOwnerReadiness;
  continuity: EmailNotificationContinuityRecord | null;
}>;

/**
 * Derive Email Notification operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateEmailNotificationOperationalState(
  input: EvaluateEmailNotificationContinuityInput,
): EmailNotificationOperationalState {
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

export function buildEmailNotificationContinuityProjection(
  input: EvaluateEmailNotificationContinuityInput,
): EmailNotificationContinuityView {
  const operationalState = evaluateEmailNotificationOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: EmailNotificationRecoveryDiagnostics | null =
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
 * Graceful degradation: Email Notification continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function emailNotificationContinuesWhileOthersDegraded(input: {
  emailNotificationState: EmailNotificationOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.emailNotificationState === 'Unavailable') {
    return false;
  }
  if (input.emailNotificationState !== 'Ready' && input.emailNotificationState !== 'Degraded') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
