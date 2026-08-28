import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildExchangeConnectivityContinuityProjection,
  evaluateExchangeConnectivityOperationalState,
  exchangeConnectivityContinuesWhileOthersDegraded,
} from '../modules/exchange-adapter/domain/exchange-connectivity-operational-continuity';
import {
  getExchangeConnectivityContinuityRecord,
  recordExchangeConnectivityIntegrityFailure,
  recordExchangeConnectivityRecoveryFailure,
  recordExchangeConnectivityRecoveryStart,
  recordExchangeConnectivityRecoverySuccess,
  resetExchangeConnectivityContinuity,
} from '../modules/exchange-adapter/domain/exchange-connectivity-continuity-status';
import { buildConnectionManagementAnchorState } from '../modules/exchange-adapter/domain/durable-exchange-connectivity-state';
import {
  buildExchangeConnectivityRecoveryDiagnostics,
  ExchangeConnectivityRestartRecoveryError,
} from '../modules/exchange-adapter/domain/exchange-connectivity-restart-recovery';
import { ExchangeConnectivityRestartRecoveryService } from '../modules/exchange-adapter/exchange-connectivity-restart-recovery.service';
import { ExchangeConnectivityRecoveryStore } from '../modules/exchange-adapter/exchange-connectivity-recovery-store';
import type { ExchangeConnectivityStateRepository } from '../modules/exchange-adapter/domain/exchange-connectivity-state.repository';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W4_E01_D_ARCHITECTURE_CLAIMS,
  W4_E01_D_CAPABILITY_EVOLUTION,
  W4_E01_D_EXPLICIT_OUT,
  W4_E01_D_OPERATIONAL_MATURITY,
  W4_E01_D_SLICE_ID,
  W4_E01_D_SUPPORTED_STATES,
  W4_E01_D_TECHNICAL_DEBT_DELTA,
  W4_E01_D_TRANSITION_MATRIX,
} from './w4-e01-d-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-28T12:00:00.000Z';

function connectionAnchor(workspaceId: string) {
  const outcome = buildConnectionManagementAnchorState({
    workspaceId,
    provider: 'BINANCE',
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
): ExchangeConnectivityStateRepository {
  return {
    saveExchangeConnectivityState: vi.fn(),
    loadExchangeConnectivityState: vi.fn(),
    listAllExchangeConnectivityStates: vi.fn(async () => states),
  };
}

describe('W4-E01-d exchange connectivity operational continuity — unit', () => {
  beforeEach(() => {
    resetExchangeConnectivityContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W4_E01_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateExchangeConnectivityOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W4_E01_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W4_E01_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordExchangeConnectivityRecoveryStart();
    recordExchangeConnectivityRecoverySuccess({
      diagnostics: buildExchangeConnectivityRecoveryDiagnostics([connectionAnchor('ws-1')]),
    });
    recordExchangeConnectivityIntegrityFailure('integrity-check-failed');
    expect(
      evaluateExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordExchangeConnectivityRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetExchangeConnectivityContinuity();
    recordExchangeConnectivityRecoveryStart();
    recordExchangeConnectivityRecoverySuccess({
      diagnostics: buildExchangeConnectivityRecoveryDiagnostics([]),
    });
    expect(
      evaluateExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('graceful degradation: healthy exchange connectivity continues while other owners degraded', () => {
    expect(
      exchangeConnectivityContinuesWhileOthersDegraded({
        exchangeConnectivityState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      exchangeConnectivityContinuesWhileOthersDegraded({
        exchangeConnectivityState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });
});

describe('W4-E01-d exchange connectivity operational continuity — integration', () => {
  beforeEach(() => {
    resetExchangeConnectivityContinuity();
  });

  it('recovered exchange connectivity operational readiness after successful hydrate', async () => {
    const repository = createRepository([connectionAnchor('ws-1')]);
    const recoveryStore = new ExchangeConnectivityRecoveryStore();
    const service = new ExchangeConnectivityRestartRecoveryService(repository, recoveryStore);

    await service.hydrate();
    const projection = buildExchangeConnectivityContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getExchangeConnectivityContinuityRecord(),
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
    const recoveryStore = new ExchangeConnectivityRecoveryStore();
    const service = new ExchangeConnectivityRestartRecoveryService(repository, recoveryStore);

    await expect(service.hydrate()).rejects.toBeInstanceOf(
      ExchangeConnectivityRestartRecoveryError,
    );
    const projection = buildExchangeConnectivityContinuityProjection({
      recovering: false,
      ownerReadiness: 'unavailable',
      continuity: getExchangeConnectivityContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Unavailable');
  });

  it('architecture / maturity / debt / transition claims', () => {
    expect(W4_E01_D_SLICE_ID).toBe('W4-E01-d');
    expect(W4_E01_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W4_E01_D_ARCHITECTURE_CLAIMS.secondOperationalStateEngine).toBe(false);
    expect(W4_E01_D_ARCHITECTURE_CLAIMS.restImplementation).toBe(false);
    expect(W4_E01_D_TRANSITION_MATRIX.stillMissing).toContain('Package Close (W4-E01-e)');
    expect(W4_E01_D_OPERATIONAL_MATURITY.after).toEqual(
      expect.arrayContaining(['Operational continuity']),
    );
    expect(W4_E01_D_CAPABILITY_EVOLUTION.deferred).toEqual(
      expect.arrayContaining(['REST/WebSocket I/O']),
    );
    expect(W4_E01_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(transitionSafetyAnswers().reusesW4E01cRecovery).toBe(true);
  });

  it('explicit OUT covers REST/WebSocket I/O and W4-E01-e', () => {
    expect(W4_E01_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['rest-connectivity', 'websocket-connectivity', 'w4-e01-e']),
    );
  });

  it('owner consistency: continuity derives from existing recovery service files', () => {
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/exchange-adapter/exchange-connectivity-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/exchange-adapter/domain/exchange-connectivity-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('required reports exist for W4-E01-d', () => {
    const wave4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');
    for (const name of [
      'w4-e01-d-implementation-report.md',
      'w4-e01-d-architecture-review.md',
      'w4-e01-d-security-review.md',
      'w4-e01-d-product-review.md',
      'w4-e01-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave4, name))).toBe(true);
    }
  });
});
