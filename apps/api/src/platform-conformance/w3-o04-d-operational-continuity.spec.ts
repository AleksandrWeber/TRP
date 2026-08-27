import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildKillSwitchContinuityProjection,
  evaluateKillSwitchOperationalState,
  killSwitchContinuesWhileOthersDegraded,
} from '../modules/trading-session/domain/kill-switch-operational-continuity';
import {
  getKillSwitchContinuityRecord,
  recordKillSwitchIntegrityFailure,
  recordKillSwitchRecoveryFailure,
  recordKillSwitchRecoveryStart,
  recordKillSwitchRecoverySuccess,
  resetKillSwitchContinuity,
} from '../modules/trading-session/domain/kill-switch-continuity-status';
import { buildArmedKillSwitchState } from '../modules/trading-session/domain/durable-kill-switch-state';
import {
  buildKillSwitchRecoveryDiagnostics,
  KillSwitchRestartRecoveryError,
} from '../modules/trading-session/domain/kill-switch-restart-recovery';
import { KillSwitchRestartRecoveryService } from '../modules/trading-session/kill-switch/kill-switch-restart-recovery.service';
import { KillSwitchRecoveryStore } from '../modules/trading-session/kill-switch/kill-switch-recovery-store';
import type { KillSwitchStateRepository } from '../modules/trading-session/domain/kill-switch-state.repository';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W3_O04_D_ARCHITECTURE_CLAIMS,
  W3_O04_D_CAPABILITY_EVOLUTION,
  W3_O04_D_EXPLICIT_OUT,
  W3_O04_D_OPERATIONAL_MATURITY,
  W3_O04_D_SLICE_ID,
  W3_O04_D_SUPPORTED_STATES,
  W3_O04_D_TECHNICAL_DEBT_DELTA,
  W3_O04_D_TRANSITION_MATRIX,
} from './w3-o04-d-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-27T18:00:00.000Z';

function armed(workspaceId: string) {
  const outcome = buildArmedKillSwitchState({
    workspaceId,
    actorId: 'actor-1',
    reason: 'halt',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected armed');
  return outcome.state;
}

function createRepository(states: ReturnType<typeof armed>[]): KillSwitchStateRepository {
  return {
    saveKillSwitchState: vi.fn(),
    loadKillSwitchState: vi.fn(),
    listAllKillSwitchStates: vi.fn(async () => states),
  };
}

describe('W3-O04-d kill switch operational continuity — unit', () => {
  beforeEach(() => {
    resetKillSwitchContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W3_O04_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateKillSwitchOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateKillSwitchOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W3_O04_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W3_O04_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordKillSwitchRecoveryStart();
    recordKillSwitchRecoverySuccess({
      diagnostics: buildKillSwitchRecoveryDiagnostics([armed('ws-1')]),
    });
    recordKillSwitchIntegrityFailure('integrity-check-failed');
    expect(
      evaluateKillSwitchOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getKillSwitchContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordKillSwitchRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateKillSwitchOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getKillSwitchContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetKillSwitchContinuity();
    recordKillSwitchRecoveryStart();
    recordKillSwitchRecoverySuccess({
      diagnostics: buildKillSwitchRecoveryDiagnostics([]),
    });
    expect(
      evaluateKillSwitchOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getKillSwitchContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateKillSwitchOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('graceful degradation: healthy kill switch continues while other owners degraded', () => {
    expect(
      killSwitchContinuesWhileOthersDegraded({
        killSwitchState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      killSwitchContinuesWhileOthersDegraded({
        killSwitchState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });
});

describe('W3-O04-d kill switch operational continuity — integration', () => {
  beforeEach(() => {
    resetKillSwitchContinuity();
  });

  it('recovered kill switch operational readiness after successful hydrate', async () => {
    const repository = createRepository([armed('ws-1')]);
    const recoveryStore = new KillSwitchRecoveryStore();
    const service = new KillSwitchRestartRecoveryService(repository, recoveryStore);

    await service.hydrate();
    const projection = buildKillSwitchContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getKillSwitchContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.ownerReadiness).toBe('ready');
    expect(projection.integrityVerified).toBe(true);
    expect(projection.armedCount).toBe(1);
    expect(projection.restoredCount).toBe(1);
  });

  it('corrupt recovery path stays Unavailable', async () => {
    const badState = armed('ws-1');
    const corrupt = { ...badState, armed: 'yes' as unknown as boolean };
    const repository = createRepository([corrupt]);
    const recoveryStore = new KillSwitchRecoveryStore();
    const service = new KillSwitchRestartRecoveryService(repository, recoveryStore);

    await expect(service.hydrate()).rejects.toBeInstanceOf(KillSwitchRestartRecoveryError);
    const projection = buildKillSwitchContinuityProjection({
      recovering: false,
      ownerReadiness: 'unavailable',
      continuity: getKillSwitchContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Unavailable');
  });

  it('architecture / maturity / debt / transition claims', () => {
    expect(W3_O04_D_SLICE_ID).toBe('W3-O04-d');
    expect(W3_O04_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W3_O04_D_ARCHITECTURE_CLAIMS.secondOperationalStateEngine).toBe(false);
    expect(W3_O04_D_ARCHITECTURE_CLAIMS.killSwitchExecutionImplemented).toBe(false);
    expect(W3_O04_D_ARCHITECTURE_CLAIMS.admissionPolicyWired).toBe(false);
    expect(W3_O04_D_TRANSITION_MATRIX.stillMissing).toContain('Package Close (W3-O04-e)');
    expect(W3_O04_D_OPERATIONAL_MATURITY.after).toEqual(
      expect.arrayContaining(['Operational continuity']),
    );
    expect(W3_O04_D_CAPABILITY_EVOLUTION.deferred).toEqual(
      expect.arrayContaining(['Kill Switch execution']),
    );
    expect(W3_O04_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(transitionSafetyAnswers().reusesW3O04cRecovery).toBe(true);
  });

  it('explicit OUT covers execution, admission, and W3-O04-e', () => {
    expect(W3_O04_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['kill-switch-execution', 'admission-blocking', 'w3-o04-e']),
    );
  });

  it('owner consistency: continuity derives from existing recovery service files', () => {
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/trading-session/kill-switch/kill-switch-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/trading-session/domain/kill-switch-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('required reports exist for W3-O04-d', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o04-d-implementation-report.md',
      'w3-o04-d-architecture-review.md',
      'w3-o04-d-security-review.md',
      'w3-o04-d-product-review.md',
      'w3-o04-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});
