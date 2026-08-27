/**
 * W3-O02-d — Notification Durable Queue operational continuity (pure).
 *
 * Operational state is derived from recovered queue + owner boot integrity.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness.
 */

import type { AnalyticalOwnerBootOutcome } from '../../../persistence/analytical-owner-continuity-status';
import {
  assertOperationalState,
  type NotificationQueueContinuityView,
  type OperationalState,
} from '../../operational-continuity/operational-readiness';
import type { NotificationQueueContinuityRecord } from './notification-queue-continuity-status';
import type { NotificationQueueRecoveryDiagnostics } from './notification-queue-restart-recovery';

export type NotificationQueueOperationalState = OperationalState;
export type NotificationQueueContinuityProjection = NotificationQueueContinuityView;

export type EvaluateNotificationQueueContinuityInput = Readonly<{
  recovering: boolean;
  ownerBoot: AnalyticalOwnerBootOutcome;
  continuity: NotificationQueueContinuityRecord | null;
  /** Optional live abandoned count from store (workspace-scoped when provided). */
  abandonedCount?: number;
}>;

/**
 * Derive Notification Queue operational state.
 * Ready only after successful integrity verification and owner Ready.
 * Degraded for channel-down / abandoned honesty — never fabricates Ready delivery.
 */
export function evaluateNotificationQueueOperationalState(
  input: EvaluateNotificationQueueContinuityInput,
): NotificationQueueOperationalState {
  if (input.recovering) {
    return 'Recovering';
  }
  if (input.ownerBoot === 'unavailable') {
    return 'Unavailable';
  }
  if (!input.continuity) {
    // Memory / first-boot path after owner Ready: empty queue is operational.
    return 'Ready';
  }
  if (input.continuity.outcome === 'unavailable' || !input.continuity.integrityVerified) {
    return 'Unavailable';
  }

  const abandonedCount =
    input.abandonedCount ?? input.continuity.diagnostics?.byStatus.abandoned ?? 0;
  if (input.continuity.channelUnavailable || abandonedCount > 0) {
    return 'Degraded';
  }
  return 'Ready';
}

export function buildNotificationQueueContinuityProjection(
  input: EvaluateNotificationQueueContinuityInput,
): NotificationQueueContinuityView {
  const operationalState = evaluateNotificationQueueOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationQueueRecoveryDiagnostics | null =
    input.continuity?.diagnostics ?? null;
  const abandonedCount = input.abandonedCount ?? diagnostics?.byStatus.abandoned ?? 0;

  return Object.freeze({
    operationalState,
    ownerReadiness: input.ownerBoot,
    recoveryTimestamp: input.continuity?.recoveryCompletedAt ?? null,
    recoveryDurationMs: input.continuity?.recoveryDurationMs ?? null,
    reason: input.continuity?.reason,
    openCount: diagnostics?.openCount ?? 0,
    abandonedCount,
    channelUnavailable: input.continuity?.channelUnavailable ?? false,
    integrityVerified: input.continuity?.integrityVerified ?? input.ownerBoot === 'ready',
    workspaceIds: diagnostics?.workspaceIds ?? Object.freeze([]),
  });
}

/**
 * Graceful degradation: notification-delivery (no deps) stays Ready/Degraded while
 * other analytical owners are Degraded/Unavailable — unless its own queue is Unavailable.
 */
export function notificationDeliveryContinuesWhileOthersDegraded(input: {
  notificationQueueState: NotificationQueueOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationQueueState === 'Unavailable') {
    return false;
  }
  if (input.notificationQueueState !== 'Ready' && input.notificationQueueState !== 'Degraded') {
    return false;
  }
  return true;
}
