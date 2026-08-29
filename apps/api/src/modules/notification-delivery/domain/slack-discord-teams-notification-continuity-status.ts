/**
 * W5-N03-c — Process-local Slack / Discord / Teams Notification continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N03-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { SlackDiscordTeamsNotificationRecoveryDiagnostics } from './slack-discord-teams-notification-restart-recovery';
import { W5_N03_C_SLACK_DISCORD_TEAMS_NOTIFICATION_RECOVERY_OWNER } from './slack-discord-teams-notification-restart-recovery';

export type SlackDiscordTeamsNotificationRecoveryOutcome = 'ready' | 'unavailable';

export type SlackDiscordTeamsNotificationOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type SlackDiscordTeamsNotificationContinuityRecord = Readonly<{
  owner: typeof W5_N03_C_SLACK_DISCORD_TEAMS_NOTIFICATION_RECOVERY_OWNER;
  outcome: SlackDiscordTeamsNotificationRecoveryOutcome;
  ownerReadiness: SlackDiscordTeamsNotificationOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: SlackDiscordTeamsNotificationRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: SlackDiscordTeamsNotificationContinuityRecord | null = null;

export function recordSlackDiscordTeamsNotificationRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N03_C_SLACK_DISCORD_TEAMS_NOTIFICATION_RECOVERY_OWNER,
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

export function recordSlackDiscordTeamsNotificationRecoverySuccess(input: {
  diagnostics: SlackDiscordTeamsNotificationRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: SlackDiscordTeamsNotificationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N03_C_SLACK_DISCORD_TEAMS_NOTIFICATION_RECOVERY_OWNER,
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

export function recordSlackDiscordTeamsNotificationRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: SlackDiscordTeamsNotificationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N03_C_SLACK_DISCORD_TEAMS_NOTIFICATION_RECOVERY_OWNER,
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
export function recordSlackDiscordTeamsNotificationIntegrityFailure(reason: string): void {
  if (!record) {
    recordSlackDiscordTeamsNotificationRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getSlackDiscordTeamsNotificationContinuityRecord(): SlackDiscordTeamsNotificationContinuityRecord | null {
  return record;
}

export function isSlackDiscordTeamsNotificationRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetSlackDiscordTeamsNotificationContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
