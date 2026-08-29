import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildSlackDiscordTeamsNotificationAnchorState } from '../modules/notification-delivery/domain/durable-slack-discord-teams-notification-anchor';
import {
  getSlackDiscordTeamsNotificationContinuityRecord,
  recordSlackDiscordTeamsNotificationIntegrityFailure,
  recordSlackDiscordTeamsNotificationRecoveryFailure,
  recordSlackDiscordTeamsNotificationRecoveryStart,
  recordSlackDiscordTeamsNotificationRecoverySuccess,
  resetSlackDiscordTeamsNotificationContinuity,
} from '../modules/notification-delivery/domain/slack-discord-teams-notification-continuity-status';
import {
  buildSlackDiscordTeamsNotificationContinuityProjection,
  evaluateSlackDiscordTeamsNotificationOperationalState,
  slackDiscordTeamsNotificationContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/slack-discord-teams-notification-operational-continuity';
import { buildSlackDiscordTeamsNotificationRecoveryDiagnostics } from '../modules/notification-delivery/domain/slack-discord-teams-notification-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N03_D_ARCHITECTURE_CLAIMS,
  W5_N03_D_EXPLICIT_OUT,
  W5_N03_D_NOTIFICATION_OWNER,
  W5_N03_D_SLICE_ID,
  W5_N03_D_SUPPORTED_STATES,
  W5_N03_D_TECHNICAL_DEBT_DELTA,
  W5_N03_D_TRANSITION_MATRIX,
} from './w5-n03-d-slack-discord-teams-notification-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
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

describe('W5-N03-d slack discord teams notification operational continuity — unit', () => {
  beforeEach(() => {
    resetSlackDiscordTeamsNotificationContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N03_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateSlackDiscordTeamsNotificationOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateSlackDiscordTeamsNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N03_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N03_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
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
});

describe('W5-N03-d slack discord teams notification operational continuity — integration', () => {
  beforeEach(() => {
    resetSlackDiscordTeamsNotificationContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N03_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes slack discord teams notification continuity view', () => {
    recordSlackDiscordTeamsNotificationRecoveryStart();
    recordSlackDiscordTeamsNotificationRecoverySuccess({
      diagnostics: buildSlackDiscordTeamsNotificationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'ntf-1'),
      ]),
    });
    const slackDiscordTeamsNotification = buildSlackDiscordTeamsNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getSlackDiscordTeamsNotificationContinuityRecord(),
    });
    const projection = buildPlatformOperationalProjection({
      owners: Object.freeze([
        Object.freeze({
          owner: 'strategy-library',
          state: 'Ready',
          recoveryRequired: true,
          dependencyOwners: Object.freeze([]),
        }),
      ]),
      recoveryTimestamp: '2026-08-28T17:00:00.000Z',
      recoveryDurationMs: 10,
      slackDiscordTeamsNotification,
    });
    expect(projection.slackDiscordTeamsNotification?.operationalState).toBe('Ready');
    expect(projection.slackDiscordTeamsNotification?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while slack discord teams notification is Unavailable', () => {
    expect(
      slackDiscordTeamsNotificationContinuesWhileOthersDegraded({
        slackDiscordTeamsNotificationState: 'Unavailable',
        otherOwnerStates: ['Ready', 'Ready'],
      }),
    ).toBe(false);
    expect(
      healthyOwnersContinueWhileOthersUnavailable([
        Object.freeze({
          owner: 'strategy-library',
          state: 'Ready',
          recoveryRequired: true,
          dependencyOwners: Object.freeze([]),
        }),
        Object.freeze({
          owner: 'exchange-scope',
          state: 'Unavailable',
          recoveryRequired: true,
          dependencyOwners: Object.freeze([]),
        }),
      ]),
    ).toBe(true);
  });

  it('transition safety answers confirm W5-N03-b/c reuse without ownership drift', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.reusesW5N03bPersistence).toBe(true);
    expect(answers.reusesW5N03cRecovery).toBe(true);
    expect(answers.degradedNeverFabricatesReady).toBe(true);
    expect(W5_N03_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N03_D_ARCHITECTURE_CLAIMS.slackNotificationsOperationalClaimed).toBe(false);
  });

  it('technical debt delta and explicit OUT cover W5-N03-e deferral', () => {
    expect(W5_N03_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N03_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N03_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n03-e', 'persistence-changes']),
    );
    expect(
      W5_N03_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n03-d-implementation-report.md',
      'w5-n03-d-architecture-review.md',
      'w5-n03-d-security-review.md',
      'w5-n03-d-product-review.md',
      'w5-n03-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/slack-discord-teams-notification-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N03-d', () => {
    expect(W5_N03_D_SLICE_ID).toBe('W5-N03-d');
  });
});
