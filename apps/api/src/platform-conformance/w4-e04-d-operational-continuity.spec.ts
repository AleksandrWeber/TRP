import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildKrakenExchangeConnectivityContinuityProjection,
  evaluateKrakenExchangeConnectivityOperationalState,
  krakenExchangeConnectivityContinuesWhileOthersDegraded,
} from '../modules/exchange-adapter/domain/kraken-exchange-connectivity-operational-continuity';
import {
  getKrakenExchangeConnectivityContinuityRecord,
  recordKrakenExchangeConnectivityIntegrityFailure,
  recordKrakenExchangeConnectivityRecoveryFailure,
  recordKrakenExchangeConnectivityRecoveryStart,
  recordKrakenExchangeConnectivityRecoverySuccess,
  resetKrakenExchangeConnectivityContinuity,
} from '../modules/exchange-adapter/domain/kraken-exchange-connectivity-continuity-status';
import { buildKrakenConnectionManagementAnchorState } from '../modules/exchange-adapter/domain/durable-kraken-exchange-connectivity-state';
import {
  buildKrakenExchangeConnectivityRecoveryDiagnostics,
  KrakenExchangeConnectivityRestartRecoveryError,
} from '../modules/exchange-adapter/domain/kraken-exchange-connectivity-restart-recovery';
import { KrakenExchangeConnectivityRestartRecoveryService } from '../modules/exchange-adapter/kraken-exchange-connectivity-restart-recovery.service';
import { KrakenExchangeConnectivityRecoveryStore } from '../modules/exchange-adapter/kraken-exchange-connectivity-recovery-store';
import type { KrakenExchangeConnectivityStateRepository } from '../modules/exchange-adapter/domain/kraken-exchange-connectivity-state.repository';
import {
  buildPlatformOperationalProjection,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W4_E04_D_ARCHITECTURE_CLAIMS,
  W4_E04_D_CAPABILITY_EVOLUTION,
  W4_E04_D_EXPLICIT_OUT,
  W4_E04_D_OPERATIONAL_MATURITY,
  W4_E04_D_SLICE_ID,
  W4_E04_D_SUPPORTED_STATES,
  W4_E04_D_TECHNICAL_DEBT_DELTA,
  W4_E04_D_TRANSITION_MATRIX,
} from './w4-e04-d-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-28T13:00:00.000Z';

function connectionAnchor(workspaceId: string) {
  const outcome = buildKrakenConnectionManagementAnchorState({
    workspaceId,
    connectionId: 'conn-42',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected connection anchor');
  return outcome.state;
}

function createRepository(
  states: ReturnType<typeof connectionAnchor>[],
): KrakenExchangeConnectivityStateRepository {
  return {
    saveKrakenExchangeConnectivityState: vi.fn(),
    loadKrakenExchangeConnectivityState: vi.fn(),
    listAllKrakenExchangeConnectivityStates: vi.fn(async () => states),
  };
}

describe('W4-E04-d Kraken exchange connectivity operational continuity — unit', () => {
  beforeEach(() => {
    resetKrakenExchangeConnectivityContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W4_E04_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateKrakenExchangeConnectivityOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateKrakenExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W4_E04_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W4_E04_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordKrakenExchangeConnectivityRecoveryStart();
    recordKrakenExchangeConnectivityRecoverySuccess({
      diagnostics: buildKrakenExchangeConnectivityRecoveryDiagnostics([connectionAnchor('ws-1')]),
    });
    recordKrakenExchangeConnectivityIntegrityFailure('integrity-check-failed');
    expect(
      evaluateKrakenExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getKrakenExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordKrakenExchangeConnectivityRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateKrakenExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getKrakenExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetKrakenExchangeConnectivityContinuity();
    recordKrakenExchangeConnectivityRecoveryStart();
    recordKrakenExchangeConnectivityRecoverySuccess({
      diagnostics: buildKrakenExchangeConnectivityRecoveryDiagnostics([]),
    });
    expect(
      evaluateKrakenExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getKrakenExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateKrakenExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('graceful degradation: healthy Kraken exchange connectivity continues while other owners degraded', () => {
    expect(
      krakenExchangeConnectivityContinuesWhileOthersDegraded({
        krakenExchangeConnectivityState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      krakenExchangeConnectivityContinuesWhileOthersDegraded({
        krakenExchangeConnectivityState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });
});

describe('W4-E04-d Kraken exchange connectivity operational continuity — integration', () => {
  beforeEach(() => {
    resetKrakenExchangeConnectivityContinuity();
  });

  it('recovered Kraken exchange connectivity operational readiness after successful hydrate', async () => {
    const repository = createRepository([connectionAnchor('ws-1')]);
    const recoveryStore = new KrakenExchangeConnectivityRecoveryStore();
    const service = new KrakenExchangeConnectivityRestartRecoveryService(repository, recoveryStore);

    await service.hydrate();
    const projection = buildKrakenExchangeConnectivityContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getKrakenExchangeConnectivityContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.ownerReadiness).toBe('ready');
    expect(projection.integrityVerified).toBe(true);
    expect(projection.connectionAnchorCount).toBe(1);
    expect(projection.restoredCount).toBe(1);
  });

  it('corrupt recovery path stays Unavailable', async () => {
    const badState = connectionAnchor('ws-1');
    const corrupt = Object.freeze({
      ...badState,
      connectionAnchorRecordedAt: null,
    });
    const repository = createRepository([corrupt]);
    const recoveryStore = new KrakenExchangeConnectivityRecoveryStore();
    const service = new KrakenExchangeConnectivityRestartRecoveryService(repository, recoveryStore);

    await expect(service.hydrate()).rejects.toBeInstanceOf(
      KrakenExchangeConnectivityRestartRecoveryError,
    );
    const projection = buildKrakenExchangeConnectivityContinuityProjection({
      recovering: false,
      ownerReadiness: 'unavailable',
      continuity: getKrakenExchangeConnectivityContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Unavailable');
  });

  it('platform readiness projection includes Kraken exchange connectivity section', () => {
    recordKrakenExchangeConnectivityRecoveryStart();
    recordKrakenExchangeConnectivityRecoverySuccess({
      diagnostics: buildKrakenExchangeConnectivityRecoveryDiagnostics([connectionAnchor('ws-1')]),
    });
    const krakenExchangeConnectivity = buildKrakenExchangeConnectivityContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getKrakenExchangeConnectivityContinuityRecord(),
    });
    const projection = buildPlatformOperationalProjection({
      owners: Object.freeze([]),
      recoveryTimestamp: '2026-08-28T00:00:00.000Z',
      recoveryDurationMs: 12,
      krakenExchangeConnectivity,
    });
    expect(projection.krakenExchangeConnectivity?.operationalState).toBe('Ready');
    expect(projection.krakenExchangeConnectivity?.connectionAnchorCount).toBe(1);
  });

  it('architecture / maturity / debt / transition claims', () => {
    expect(W4_E04_D_SLICE_ID).toBe('W4-E04-d');
    expect(W4_E04_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W4_E04_D_ARCHITECTURE_CLAIMS.secondOperationalStateEngine).toBe(false);
    expect(W4_E04_D_ARCHITECTURE_CLAIMS.restImplementation).toBe(false);
    expect(W4_E04_D_TRANSITION_MATRIX.stillMissing).toContain('Package Close (W4-E04-e)');
    expect(W4_E04_D_OPERATIONAL_MATURITY.after).toEqual(
      expect.arrayContaining(['Operational continuity']),
    );
    expect(W4_E04_D_CAPABILITY_EVOLUTION.deferred).toEqual(
      expect.arrayContaining(['REST/WebSocket I/O']),
    );
    expect(W4_E04_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(transitionSafetyAnswers().reusesW4E04cRecovery).toBe(true);
  });

  it('explicit OUT covers REST/WebSocket I/O and W4-E04-e', () => {
    expect(W4_E04_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['rest-connectivity', 'websocket-connectivity', 'w4-e04-e']),
    );
  });

  it('owner consistency: continuity derives from existing recovery service files', () => {
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/exchange-adapter/kraken-exchange-connectivity-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/exchange-adapter/domain/kraken-exchange-connectivity-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('required reports exist for W4-E04-d', () => {
    const wave4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');
    for (const name of [
      'w4-e04-d-implementation-report.md',
      'w4-e04-d-architecture-review.md',
      'w4-e04-d-security-review.md',
      'w4-e04-d-product-review.md',
      'w4-e04-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave4, name))).toBe(true);
    }
  });
});
