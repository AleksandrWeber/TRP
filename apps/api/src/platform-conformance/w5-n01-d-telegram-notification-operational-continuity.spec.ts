import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildTelegramNotificationAnchorState } from '../modules/notification-delivery/domain/durable-telegram-notification-anchor';
import {
  getTelegramNotificationContinuityRecord,
  recordTelegramNotificationIntegrityFailure,
  recordTelegramNotificationRecoveryFailure,
  recordTelegramNotificationRecoveryStart,
  recordTelegramNotificationRecoverySuccess,
  resetTelegramNotificationContinuity,
} from '../modules/notification-delivery/domain/telegram-notification-continuity-status';
import {
  buildTelegramNotificationContinuityProjection,
  evaluateTelegramNotificationOperationalState,
  telegramNotificationContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/telegram-notification-operational-continuity';
import { buildTelegramNotificationRecoveryDiagnostics } from '../modules/notification-delivery/domain/telegram-notification-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N01_D_ARCHITECTURE_CLAIMS,
  W5_N01_D_EXPLICIT_OUT,
  W5_N01_D_NOTIFICATION_OWNER,
  W5_N01_D_SLICE_ID,
  W5_N01_D_SUPPORTED_STATES,
  W5_N01_D_TECHNICAL_DEBT_DELTA,
  W5_N01_D_TRANSITION_MATRIX,
} from './w5-n01-d-telegram-notification-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-28T16:00:00.000Z';

function canonicalAnchor(workspaceId: string, notificationId: string) {
  const outcome = buildTelegramNotificationAnchorState({
    workspaceId,
    notificationId,
    notificationChannel: 'telegram',
    notificationType: 'report-complete',
    recipientIdentifier: 'chat:123',
    templateIdentifier: 'inline:report-complete',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('W5-N01-d telegram notification operational continuity — unit', () => {
  beforeEach(() => {
    resetTelegramNotificationContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N01_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateTelegramNotificationOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateTelegramNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N01_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N01_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordTelegramNotificationRecoveryStart();
    recordTelegramNotificationRecoverySuccess({
      diagnostics: buildTelegramNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    recordTelegramNotificationIntegrityFailure('integrity-check-failed');
    expect(
      evaluateTelegramNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getTelegramNotificationContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordTelegramNotificationRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateTelegramNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getTelegramNotificationContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetTelegramNotificationContinuity();
    recordTelegramNotificationRecoveryStart();
    recordTelegramNotificationRecoverySuccess({
      diagnostics: buildTelegramNotificationRecoveryDiagnostics([]),
    });
    expect(
      evaluateTelegramNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getTelegramNotificationContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordTelegramNotificationRecoveryStart();
    recordTelegramNotificationRecoverySuccess({
      diagnostics: buildTelegramNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    recordTelegramNotificationIntegrityFailure('integrity-check-failed');
    const projection = buildTelegramNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getTelegramNotificationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N01-d telegram notification operational continuity — integration', () => {
  beforeEach(() => {
    resetTelegramNotificationContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N01_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes telegram notification continuity view', () => {
    recordTelegramNotificationRecoveryStart();
    recordTelegramNotificationRecoverySuccess({
      diagnostics: buildTelegramNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    const telegramNotification = buildTelegramNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getTelegramNotificationContinuityRecord(),
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
      recoveryTimestamp: '2026-08-28T16:00:00.000Z',
      recoveryDurationMs: 10,
      telegramNotification,
    });
    expect(projection.telegramNotification?.operationalState).toBe('Ready');
    expect(projection.telegramNotification?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while telegram notification is Unavailable', () => {
    expect(
      telegramNotificationContinuesWhileOthersDegraded({
        telegramNotificationState: 'Unavailable',
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

  it('transition safety answers confirm W5-N01-b/c reuse without ownership drift', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.reusesW5N01bPersistence).toBe(true);
    expect(answers.reusesW5N01cRecovery).toBe(true);
    expect(answers.degradedNeverFabricatesReady).toBe(true);
    expect(W5_N01_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N01_D_ARCHITECTURE_CLAIMS.telegramNotificationsOperationalClaimed).toBe(false);
  });

  it('technical debt delta and explicit OUT cover W5-N01-e deferral', () => {
    expect(W5_N01_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N01_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N01_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n01-e', 'persistence-changes']),
    );
    expect(
      W5_N01_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n01-d-implementation-report.md',
      'w5-n01-d-architecture-review.md',
      'w5-n01-d-security-review.md',
      'w5-n01-d-product-review.md',
      'w5-n01-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/telegram-notification-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N01-d', () => {
    expect(W5_N01_D_SLICE_ID).toBe('W5-N01-d');
  });
});
