import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildBybitExchangeConnectivityContinuityProjection,
  evaluateBybitExchangeConnectivityOperationalState,
  bybitExchangeConnectivityContinuesWhileOthersDegraded,
} from '../modules/exchange-adapter/domain/bybit-exchange-connectivity-operational-continuity';
import {
  getBybitExchangeConnectivityContinuityRecord,
  recordBybitExchangeConnectivityIntegrityFailure,
  recordBybitExchangeConnectivityRecoveryFailure,
  recordBybitExchangeConnectivityRecoveryStart,
  recordBybitExchangeConnectivityRecoverySuccess,
  resetBybitExchangeConnectivityContinuity,
} from '../modules/exchange-adapter/domain/bybit-exchange-connectivity-continuity-status';
import { buildBybitConnectionManagementAnchorState } from '../modules/exchange-adapter/domain/durable-bybit-exchange-connectivity-state';
import {
  buildBybitExchangeConnectivityRecoveryDiagnostics,
  BybitExchangeConnectivityRestartRecoveryError,
} from '../modules/exchange-adapter/domain/bybit-exchange-connectivity-restart-recovery';
import { BybitExchangeConnectivityRestartRecoveryService } from '../modules/exchange-adapter/bybit-exchange-connectivity-restart-recovery.service';
import { BybitExchangeConnectivityRecoveryStore } from '../modules/exchange-adapter/bybit-exchange-connectivity-recovery-store';
import type { BybitExchangeConnectivityStateRepository } from '../modules/exchange-adapter/domain/bybit-exchange-connectivity-state.repository';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W4_E02_D_ARCHITECTURE_CLAIMS,
  W4_E02_D_CAPABILITY_EVOLUTION,
  W4_E02_D_EXPLICIT_OUT,
  W4_E02_D_OPERATIONAL_MATURITY,
  W4_E02_D_SLICE_ID,
  W4_E02_D_SUPPORTED_STATES,
  W4_E02_D_TECHNICAL_DEBT_DELTA,
  W4_E02_D_TRANSITION_MATRIX,
} from './w4-e02-d-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-28T13:00:00.000Z';

function connectionAnchor(workspaceId: string) {
  const outcome = buildBybitConnectionManagementAnchorState({
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
): BybitExchangeConnectivityStateRepository {
  return {
    saveBybitExchangeConnectivityState: vi.fn(),
    loadBybitExchangeConnectivityState: vi.fn(),
    listAllBybitExchangeConnectivityStates: vi.fn(async () => states),
  };
}

describe('W4-E02-d Bybit exchange connectivity operational continuity — unit', () => {
  beforeEach(() => {
    resetBybitExchangeConnectivityContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W4_E02_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateBybitExchangeConnectivityOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateBybitExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W4_E02_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W4_E02_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordBybitExchangeConnectivityRecoveryStart();
    recordBybitExchangeConnectivityRecoverySuccess({
      diagnostics: buildBybitExchangeConnectivityRecoveryDiagnostics([connectionAnchor('ws-1')]),
    });
    recordBybitExchangeConnectivityIntegrityFailure('integrity-check-failed');
    expect(
      evaluateBybitExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getBybitExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordBybitExchangeConnectivityRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateBybitExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getBybitExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetBybitExchangeConnectivityContinuity();
    recordBybitExchangeConnectivityRecoveryStart();
    recordBybitExchangeConnectivityRecoverySuccess({
      diagnostics: buildBybitExchangeConnectivityRecoveryDiagnostics([]),
    });
    expect(
      evaluateBybitExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getBybitExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateBybitExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('graceful degradation: healthy Bybit exchange connectivity continues while other owners degraded', () => {
    expect(
      bybitExchangeConnectivityContinuesWhileOthersDegraded({
        bybitExchangeConnectivityState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      bybitExchangeConnectivityContinuesWhileOthersDegraded({
        bybitExchangeConnectivityState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });
});

describe('W4-E02-d Bybit exchange connectivity operational continuity — integration', () => {
  beforeEach(() => {
    resetBybitExchangeConnectivityContinuity();
  });

  it('recovered Bybit exchange connectivity operational readiness after successful hydrate', async () => {
    const repository = createRepository([connectionAnchor('ws-1')]);
    const recoveryStore = new BybitExchangeConnectivityRecoveryStore();
    const service = new BybitExchangeConnectivityRestartRecoveryService(repository, recoveryStore);

    await service.hydrate();
    const projection = buildBybitExchangeConnectivityContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getBybitExchangeConnectivityContinuityRecord(),
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
    const recoveryStore = new BybitExchangeConnectivityRecoveryStore();
    const service = new BybitExchangeConnectivityRestartRecoveryService(repository, recoveryStore);

    await expect(service.hydrate()).rejects.toBeInstanceOf(
      BybitExchangeConnectivityRestartRecoveryError,
    );
    const projection = buildBybitExchangeConnectivityContinuityProjection({
      recovering: false,
      ownerReadiness: 'unavailable',
      continuity: getBybitExchangeConnectivityContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Unavailable');
  });

  it('architecture / maturity / debt / transition claims', () => {
    expect(W4_E02_D_SLICE_ID).toBe('W4-E02-d');
    expect(W4_E02_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W4_E02_D_ARCHITECTURE_CLAIMS.secondOperationalStateEngine).toBe(false);
    expect(W4_E02_D_ARCHITECTURE_CLAIMS.restImplementation).toBe(false);
    expect(W4_E02_D_TRANSITION_MATRIX.stillMissing).toContain('Package Close (W4-E02-e)');
    expect(W4_E02_D_OPERATIONAL_MATURITY.after).toEqual(
      expect.arrayContaining(['Operational continuity']),
    );
    expect(W4_E02_D_CAPABILITY_EVOLUTION.deferred).toEqual(
      expect.arrayContaining(['REST/WebSocket I/O']),
    );
    expect(W4_E02_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(transitionSafetyAnswers().reusesW4E02cRecovery).toBe(true);
  });

  it('explicit OUT covers REST/WebSocket I/O and W4-E02-e', () => {
    expect(W4_E02_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['rest-connectivity', 'websocket-connectivity', 'w4-e02-e']),
    );
  });

  it('owner consistency: continuity derives from existing recovery service files', () => {
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/exchange-adapter/bybit-exchange-connectivity-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/exchange-adapter/domain/bybit-exchange-connectivity-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('required reports exist for W4-E02-d', () => {
    const wave4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');
    for (const name of [
      'w4-e02-d-implementation-report.md',
      'w4-e02-d-architecture-review.md',
      'w4-e02-d-security-review.md',
      'w4-e02-d-product-review.md',
      'w4-e02-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave4, name))).toBe(true);
    }
  });
});
