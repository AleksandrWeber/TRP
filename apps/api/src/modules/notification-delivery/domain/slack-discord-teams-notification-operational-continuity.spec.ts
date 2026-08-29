import { beforeEach, describe, expect, it } from 'vitest';
import { buildSlackDiscordTeamsNotificationAnchorState } from './durable-slack-discord-teams-notification-anchor';
import {
  getSlackDiscordTeamsNotificationContinuityRecord,
  recordSlackDiscordTeamsNotificationIntegrityFailure,
  recordSlackDiscordTeamsNotificationRecoveryFailure,
  recordSlackDiscordTeamsNotificationRecoveryStart,
  recordSlackDiscordTeamsNotificationRecoverySuccess,
  resetSlackDiscordTeamsNotificationContinuity,
} from './slack-discord-teams-notification-continuity-status';
import {
  buildSlackDiscordTeamsNotificationContinuityProjection,
  evaluateSlackDiscordTeamsNotificationOperationalState,
  slackDiscordTeamsNotificationContinuesWhileOthersDegraded,
} from './slack-discord-teams-notification-operational-continuity';
import { buildSlackDiscordTeamsNotificationRecoveryDiagnostics } from './slack-discord-teams-notification-restart-recovery';

const recordedAt = '2026-08-28T17:00:00.000Z';

function canonicalAnchor(workspaceId: string, notificationId: string) {
  const outcome = buildSlackDiscordTeamsNotificationAnchorState({
    workspaceId,
    notificationId,
    notificationChannel: 'slack',
    notificationType: 'report-complete',
    recipientIdentifier: 'https://hooks.slack.com/services/example',
    templateIdentifier: 'inline:report-complete',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('slack-discord-teams-notification-operational-continuity domain — W5-N03-d', () => {
  beforeEach(() => {
    resetSlackDiscordTeamsNotificationContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordSlackDiscordTeamsNotificationRecoveryStart();
    recordSlackDiscordTeamsNotificationRecoverySuccess({
      diagnostics: buildSlackDiscordTeamsNotificationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'ntf-1'),
      ]),
    });
    recordSlackDiscordTeamsNotificationIntegrityFailure('integrity-check-failed');
    expect(
      evaluateSlackDiscordTeamsNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getSlackDiscordTeamsNotificationContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordSlackDiscordTeamsNotificationRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateSlackDiscordTeamsNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getSlackDiscordTeamsNotificationContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetSlackDiscordTeamsNotificationContinuity();
    recordSlackDiscordTeamsNotificationRecoveryStart();
    recordSlackDiscordTeamsNotificationRecoverySuccess({
      diagnostics: buildSlackDiscordTeamsNotificationRecoveryDiagnostics([]),
    });
    expect(
      evaluateSlackDiscordTeamsNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getSlackDiscordTeamsNotificationContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateSlackDiscordTeamsNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordSlackDiscordTeamsNotificationRecoveryStart();
    recordSlackDiscordTeamsNotificationRecoverySuccess({
      diagnostics: buildSlackDiscordTeamsNotificationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'ntf-1'),
      ]),
    });
    recordSlackDiscordTeamsNotificationIntegrityFailure('integrity-check-failed');
    const projection = buildSlackDiscordTeamsNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getSlackDiscordTeamsNotificationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy Slack / Discord / Teams notification continues while other owners degraded', () => {
    expect(
      slackDiscordTeamsNotificationContinuesWhileOthersDegraded({
        slackDiscordTeamsNotificationState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      slackDiscordTeamsNotificationContinuesWhileOthersDegraded({
        slackDiscordTeamsNotificationState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordSlackDiscordTeamsNotificationRecoveryStart();
    recordSlackDiscordTeamsNotificationRecoverySuccess({
      diagnostics: buildSlackDiscordTeamsNotificationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'ntf-1'),
      ]),
    });
    const projection = buildSlackDiscordTeamsNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getSlackDiscordTeamsNotificationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
