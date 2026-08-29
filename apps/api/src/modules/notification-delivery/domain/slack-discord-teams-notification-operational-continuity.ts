/**
 * W5-N03-d — Slack / Discord / Teams Notification operational continuity (pure).
 *
 * Operational state is derived from W5-N03-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or delivery labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type SlackDiscordTeamsNotificationContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  SlackDiscordTeamsNotificationContinuityRecord,
  SlackDiscordTeamsNotificationOwnerReadiness,
} from './slack-discord-teams-notification-continuity-status';
import type { SlackDiscordTeamsNotificationRecoveryDiagnostics } from './slack-discord-teams-notification-restart-recovery';

export type SlackDiscordTeamsNotificationOperationalState = OperationalState;
export type SlackDiscordTeamsNotificationContinuityProjection =
  SlackDiscordTeamsNotificationContinuityView;

export type EvaluateSlackDiscordTeamsNotificationContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: SlackDiscordTeamsNotificationOwnerReadiness;
  continuity: SlackDiscordTeamsNotificationContinuityRecord | null;
}>;

/**
 * Derive Slack / Discord / Teams Notification operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateSlackDiscordTeamsNotificationOperationalState(
  input: EvaluateSlackDiscordTeamsNotificationContinuityInput,
): SlackDiscordTeamsNotificationOperationalState {
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

export function buildSlackDiscordTeamsNotificationContinuityProjection(
  input: EvaluateSlackDiscordTeamsNotificationContinuityInput,
): SlackDiscordTeamsNotificationContinuityView {
  const operationalState = evaluateSlackDiscordTeamsNotificationOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: SlackDiscordTeamsNotificationRecoveryDiagnostics | null =
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
 * Graceful degradation: Slack / Discord / Teams Notification continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function slackDiscordTeamsNotificationContinuesWhileOthersDegraded(input: {
  slackDiscordTeamsNotificationState: SlackDiscordTeamsNotificationOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.slackDiscordTeamsNotificationState === 'Unavailable') {
    return false;
  }
  if (
    input.slackDiscordTeamsNotificationState !== 'Ready' &&
    input.slackDiscordTeamsNotificationState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
