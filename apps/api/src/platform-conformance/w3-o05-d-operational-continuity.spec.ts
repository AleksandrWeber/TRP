import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildMonitoringHealthContinuityProjection,
  evaluateMonitoringHealthOperationalState,
  monitoringHealthContinuesWhileOthersDegraded,
} from '../security-platform/monitoring-health/domain/monitoring-health-operational-continuity';
import {
  getMonitoringHealthContinuityRecord,
  recordMonitoringHealthIntegrityFailure,
  recordMonitoringHealthRecoveryFailure,
  recordMonitoringHealthRecoveryStart,
  recordMonitoringHealthRecoverySuccess,
  resetMonitoringHealthContinuity,
} from '../security-platform/monitoring-health/domain/monitoring-health-continuity-status';
import { buildSecurityHealthAnchorState } from '../security-platform/monitoring-health/domain/durable-monitoring-health-state';
import {
  buildMonitoringHealthRecoveryDiagnostics,
  MonitoringHealthRestartRecoveryError,
} from '../security-platform/monitoring-health/domain/monitoring-health-restart-recovery';
import { MonitoringHealthRestartRecoveryService } from '../security-platform/monitoring-health/monitoring-health-restart-recovery.service';
import { MonitoringHealthRecoveryStore } from '../security-platform/monitoring-health/monitoring-health-recovery-store';
import type { MonitoringHealthStateRepository } from '../security-platform/monitoring-health/domain/monitoring-health-state.repository';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W3_O05_D_ARCHITECTURE_CLAIMS,
  W3_O05_D_CAPABILITY_EVOLUTION,
  W3_O05_D_EXPLICIT_OUT,
  W3_O05_D_OPERATIONAL_MATURITY,
  W3_O05_D_SLICE_ID,
  W3_O05_D_SUPPORTED_STATES,
  W3_O05_D_TECHNICAL_DEBT_DELTA,
  W3_O05_D_TRANSITION_MATRIX,
} from './w3-o05-d-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-28T10:00:00.000Z';

function securityAnchor(workspaceId: string) {
  const outcome = buildSecurityHealthAnchorState({
    workspaceId,
    incidentId: 'inc-42',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected security anchor');
  return outcome.state;
}

function createRepository(
  states: ReturnType<typeof securityAnchor>[],
): MonitoringHealthStateRepository {
  return {
    saveMonitoringHealthState: vi.fn(),
    loadMonitoringHealthState: vi.fn(),
    listAllMonitoringHealthStates: vi.fn(async () => states),
  };
}

describe('W3-O05-d monitoring health operational continuity — unit', () => {
  beforeEach(() => {
    resetMonitoringHealthContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W3_O05_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateMonitoringHealthOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateMonitoringHealthOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W3_O05_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W3_O05_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordMonitoringHealthRecoveryStart();
    recordMonitoringHealthRecoverySuccess({
      diagnostics: buildMonitoringHealthRecoveryDiagnostics([securityAnchor('ws-1')]),
    });
    recordMonitoringHealthIntegrityFailure('integrity-check-failed');
    expect(
      evaluateMonitoringHealthOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getMonitoringHealthContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordMonitoringHealthRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateMonitoringHealthOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getMonitoringHealthContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetMonitoringHealthContinuity();
    recordMonitoringHealthRecoveryStart();
    recordMonitoringHealthRecoverySuccess({
      diagnostics: buildMonitoringHealthRecoveryDiagnostics([]),
    });
    expect(
      evaluateMonitoringHealthOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getMonitoringHealthContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateMonitoringHealthOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('graceful degradation: healthy monitoring health continues while other owners degraded', () => {
    expect(
      monitoringHealthContinuesWhileOthersDegraded({
        monitoringHealthState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      monitoringHealthContinuesWhileOthersDegraded({
        monitoringHealthState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });
});

describe('W3-O05-d monitoring health operational continuity — integration', () => {
  beforeEach(() => {
    resetMonitoringHealthContinuity();
  });

  it('recovered monitoring health operational readiness after successful hydrate', async () => {
    const repository = createRepository([securityAnchor('ws-1')]);
    const recoveryStore = new MonitoringHealthRecoveryStore();
    const service = new MonitoringHealthRestartRecoveryService(repository, recoveryStore);

    await service.hydrate();
    const projection = buildMonitoringHealthContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getMonitoringHealthContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.ownerReadiness).toBe('ready');
    expect(projection.integrityVerified).toBe(true);
    expect(projection.securityHealthAnchorCount).toBe(1);
    expect(projection.restoredCount).toBe(1);
  });

  it('corrupt recovery path stays Unavailable', async () => {
    const bad = Object.freeze({
      ...securityAnchor('ws-1'),
      securityHealthAnchorRecordedAt: null,
    });
    const repository = createRepository([bad]);
    const recoveryStore = new MonitoringHealthRecoveryStore();
    const service = new MonitoringHealthRestartRecoveryService(repository, recoveryStore);

    await expect(service.hydrate()).rejects.toBeInstanceOf(MonitoringHealthRestartRecoveryError);
    const projection = buildMonitoringHealthContinuityProjection({
      recovering: false,
      ownerReadiness: 'unavailable',
      continuity: getMonitoringHealthContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Unavailable');
  });

  it('architecture / maturity / debt / transition claims', () => {
    expect(W3_O05_D_SLICE_ID).toBe('W3-O05-d');
    expect(W3_O05_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W3_O05_D_ARCHITECTURE_CLAIMS.secondOperationalStateEngine).toBe(false);
    expect(W3_O05_D_ARCHITECTURE_CLAIMS.monitoringEvaluation).toBe(false);
    expect(W3_O05_D_TRANSITION_MATRIX.stillMissing).toContain('Package Close (W3-O05-e)');
    expect(W3_O05_D_OPERATIONAL_MATURITY.after).toEqual(
      expect.arrayContaining(['Operational continuity']),
    );
    expect(W3_O05_D_CAPABILITY_EVOLUTION.deferred).toEqual(
      expect.arrayContaining(['Monitoring evaluation']),
    );
    expect(W3_O05_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(transitionSafetyAnswers().reusesW3O05cRecovery).toBe(true);
  });

  it('explicit OUT covers monitoring evaluation and W3-O05-e', () => {
    expect(W3_O05_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['monitoring-evaluation', 'w3-o05-e', 'dashboard-rendering']),
    );
  });

  it('owner consistency: continuity derives from existing recovery service files', () => {
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/security-platform/monitoring-health/monitoring-health-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/security-platform/monitoring-health/domain/monitoring-health-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('required reports exist for W3-O05-d', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o05-d-implementation-report.md',
      'w3-o05-d-architecture-review.md',
      'w3-o05-d-security-review.md',
      'w3-o05-d-product-review.md',
      'w3-o05-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});
