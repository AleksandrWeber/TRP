import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildEmailNotificationAnchorState } from '../modules/notification-delivery/domain/durable-email-notification-anchor';
import {
  getEmailNotificationContinuityRecord,
  recordEmailNotificationIntegrityFailure,
  recordEmailNotificationRecoveryFailure,
  recordEmailNotificationRecoveryStart,
  recordEmailNotificationRecoverySuccess,
  resetEmailNotificationContinuity,
} from '../modules/notification-delivery/domain/email-notification-continuity-status';
import {
  buildEmailNotificationContinuityProjection,
  evaluateEmailNotificationOperationalState,
  emailNotificationContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/email-notification-operational-continuity';
import { buildEmailNotificationRecoveryDiagnostics } from '../modules/notification-delivery/domain/email-notification-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N02_D_ARCHITECTURE_CLAIMS,
  W5_N02_D_EXPLICIT_OUT,
  W5_N02_D_NOTIFICATION_OWNER,
  W5_N02_D_SLICE_ID,
  W5_N02_D_SUPPORTED_STATES,
  W5_N02_D_TECHNICAL_DEBT_DELTA,
  W5_N02_D_TRANSITION_MATRIX,
} from './w5-n02-d-email-notification-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-28T17:00:00.000Z';

function canonicalAnchor(workspaceId: string, notificationId: string) {
  const outcome = buildEmailNotificationAnchorState({
    workspaceId,
    notificationId,
    notificationChannel: 'email',
    notificationType: 'report-complete',
    recipientIdentifier: 'user@example.com',
    templateIdentifier: 'inline:report-complete',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('W5-N02-d email notification operational continuity — unit', () => {
  beforeEach(() => {
    resetEmailNotificationContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N02_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateEmailNotificationOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateEmailNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N02_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N02_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordEmailNotificationRecoveryStart();
    recordEmailNotificationRecoverySuccess({
      diagnostics: buildEmailNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    recordEmailNotificationIntegrityFailure('integrity-check-failed');
    expect(
      evaluateEmailNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getEmailNotificationContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordEmailNotificationRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateEmailNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getEmailNotificationContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetEmailNotificationContinuity();
    recordEmailNotificationRecoveryStart();
    recordEmailNotificationRecoverySuccess({
      diagnostics: buildEmailNotificationRecoveryDiagnostics([]),
    });
    expect(
      evaluateEmailNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getEmailNotificationContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordEmailNotificationRecoveryStart();
    recordEmailNotificationRecoverySuccess({
      diagnostics: buildEmailNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    recordEmailNotificationIntegrityFailure('integrity-check-failed');
    const projection = buildEmailNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getEmailNotificationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N02-d email notification operational continuity — integration', () => {
  beforeEach(() => {
    resetEmailNotificationContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N02_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes email notification continuity view', () => {
    recordEmailNotificationRecoveryStart();
    recordEmailNotificationRecoverySuccess({
      diagnostics: buildEmailNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    const emailNotification = buildEmailNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getEmailNotificationContinuityRecord(),
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
      emailNotification,
    });
    expect(projection.emailNotification?.operationalState).toBe('Ready');
    expect(projection.emailNotification?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while email notification is Unavailable', () => {
    expect(
      emailNotificationContinuesWhileOthersDegraded({
        emailNotificationState: 'Unavailable',
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

  it('transition safety answers confirm W5-N02-b/c reuse without ownership drift', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.reusesW5N02bPersistence).toBe(true);
    expect(answers.reusesW5N02cRecovery).toBe(true);
    expect(answers.degradedNeverFabricatesReady).toBe(true);
    expect(W5_N02_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N02_D_ARCHITECTURE_CLAIMS.emailNotificationsOperationalClaimed).toBe(false);
  });

  it('technical debt delta and explicit OUT cover W5-N02-e deferral', () => {
    expect(W5_N02_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N02_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N02_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n02-e', 'persistence-changes']),
    );
    expect(
      W5_N02_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n02-d-implementation-report.md',
      'w5-n02-d-architecture-review.md',
      'w5-n02-d-security-review.md',
      'w5-n02-d-product-review.md',
      'w5-n02-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/email-notification-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N02-d', () => {
    expect(W5_N02_D_SLICE_ID).toBe('W5-N02-d');
  });
});
