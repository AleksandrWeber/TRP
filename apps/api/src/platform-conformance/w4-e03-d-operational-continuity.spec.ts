import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildOkxExchangeConnectivityContinuityProjection,
  evaluateOkxExchangeConnectivityOperationalState,
  okxExchangeConnectivityContinuesWhileOthersDegraded,
} from '../modules/exchange-adapter/domain/okx-exchange-connectivity-operational-continuity';
import {
  getOkxExchangeConnectivityContinuityRecord,
  recordOkxExchangeConnectivityIntegrityFailure,
  recordOkxExchangeConnectivityRecoveryFailure,
  recordOkxExchangeConnectivityRecoveryStart,
  recordOkxExchangeConnectivityRecoverySuccess,
  resetOkxExchangeConnectivityContinuity,
} from '../modules/exchange-adapter/domain/okx-exchange-connectivity-continuity-status';
import { buildOkxConnectionManagementAnchorState } from '../modules/exchange-adapter/domain/durable-okx-exchange-connectivity-state';
import {
  buildOkxExchangeConnectivityRecoveryDiagnostics,
  OkxExchangeConnectivityRestartRecoveryError,
} from '../modules/exchange-adapter/domain/okx-exchange-connectivity-restart-recovery';
import { OkxExchangeConnectivityRestartRecoveryService } from '../modules/exchange-adapter/okx-exchange-connectivity-restart-recovery.service';
import { OkxExchangeConnectivityRecoveryStore } from '../modules/exchange-adapter/okx-exchange-connectivity-recovery-store';
import type { OkxExchangeConnectivityStateRepository } from '../modules/exchange-adapter/domain/okx-exchange-connectivity-state.repository';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W4_E03_D_ARCHITECTURE_CLAIMS,
  W4_E03_D_CAPABILITY_EVOLUTION,
  W4_E03_D_EXPLICIT_OUT,
  W4_E03_D_OPERATIONAL_MATURITY,
  W4_E03_D_SLICE_ID,
  W4_E03_D_SUPPORTED_STATES,
  W4_E03_D_TECHNICAL_DEBT_DELTA,
  W4_E03_D_TRANSITION_MATRIX,
} from './w4-e03-d-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-28T13:00:00.000Z';

function connectionAnchor(workspaceId: string) {
  const outcome = buildOkxConnectionManagementAnchorState({
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
): OkxExchangeConnectivityStateRepository {
  return {
    saveOkxExchangeConnectivityState: vi.fn(),
    loadOkxExchangeConnectivityState: vi.fn(),
    listAllOkxExchangeConnectivityStates: vi.fn(async () => states),
  };
}

describe('W4-E03-d OKX exchange connectivity operational continuity — unit', () => {
  beforeEach(() => {
    resetOkxExchangeConnectivityContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W4_E03_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateOkxExchangeConnectivityOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateOkxExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W4_E03_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W4_E03_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordOkxExchangeConnectivityRecoveryStart();
    recordOkxExchangeConnectivityRecoverySuccess({
      diagnostics: buildOkxExchangeConnectivityRecoveryDiagnostics([connectionAnchor('ws-1')]),
    });
    recordOkxExchangeConnectivityIntegrityFailure('integrity-check-failed');
    expect(
      evaluateOkxExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getOkxExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordOkxExchangeConnectivityRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateOkxExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getOkxExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetOkxExchangeConnectivityContinuity();
    recordOkxExchangeConnectivityRecoveryStart();
    recordOkxExchangeConnectivityRecoverySuccess({
      diagnostics: buildOkxExchangeConnectivityRecoveryDiagnostics([]),
    });
    expect(
      evaluateOkxExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getOkxExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateOkxExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('graceful degradation: healthy OKX exchange connectivity continues while other owners degraded', () => {
    expect(
      okxExchangeConnectivityContinuesWhileOthersDegraded({
        okxExchangeConnectivityState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      okxExchangeConnectivityContinuesWhileOthersDegraded({
        okxExchangeConnectivityState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });
});

describe('W4-E03-d OKX exchange connectivity operational continuity — integration', () => {
  beforeEach(() => {
    resetOkxExchangeConnectivityContinuity();
  });

  it('recovered OKX exchange connectivity operational readiness after successful hydrate', async () => {
    const repository = createRepository([connectionAnchor('ws-1')]);
    const recoveryStore = new OkxExchangeConnectivityRecoveryStore();
    const service = new OkxExchangeConnectivityRestartRecoveryService(repository, recoveryStore);

    await service.hydrate();
    const projection = buildOkxExchangeConnectivityContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getOkxExchangeConnectivityContinuityRecord(),
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
    const recoveryStore = new OkxExchangeConnectivityRecoveryStore();
    const service = new OkxExchangeConnectivityRestartRecoveryService(repository, recoveryStore);

    await expect(service.hydrate()).rejects.toBeInstanceOf(
      OkxExchangeConnectivityRestartRecoveryError,
    );
    const projection = buildOkxExchangeConnectivityContinuityProjection({
      recovering: false,
      ownerReadiness: 'unavailable',
      continuity: getOkxExchangeConnectivityContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Unavailable');
  });

  it('architecture / maturity / debt / transition claims', () => {
    expect(W4_E03_D_SLICE_ID).toBe('W4-E03-d');
    expect(W4_E03_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W4_E03_D_ARCHITECTURE_CLAIMS.secondOperationalStateEngine).toBe(false);
    expect(W4_E03_D_ARCHITECTURE_CLAIMS.restImplementation).toBe(false);
    expect(W4_E03_D_TRANSITION_MATRIX.stillMissing).toContain('Package Close (W4-E03-e)');
    expect(W4_E03_D_OPERATIONAL_MATURITY.after).toEqual(
      expect.arrayContaining(['Operational continuity']),
    );
    expect(W4_E03_D_CAPABILITY_EVOLUTION.deferred).toEqual(
      expect.arrayContaining(['REST/WebSocket I/O']),
    );
    expect(W4_E03_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(transitionSafetyAnswers().reusesW4E03cRecovery).toBe(true);
  });

  it('explicit OUT covers REST/WebSocket I/O and W4-E03-e', () => {
    expect(W4_E03_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['rest-connectivity', 'websocket-connectivity', 'w4-e03-e']),
    );
  });

  it('owner consistency: continuity derives from existing recovery service files', () => {
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/exchange-adapter/okx-exchange-connectivity-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/exchange-adapter/domain/okx-exchange-connectivity-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('required reports exist for W4-E03-d', () => {
    const wave4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');
    for (const name of [
      'w4-e03-d-implementation-report.md',
      'w4-e03-d-architecture-review.md',
      'w4-e03-d-security-review.md',
      'w4-e03-d-product-review.md',
      'w4-e03-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave4, name))).toBe(true);
    }
  });
});
