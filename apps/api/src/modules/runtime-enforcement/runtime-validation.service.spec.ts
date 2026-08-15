import { describe, expect, it } from 'vitest';
import { InMemoryStrategyLibraryReadAdapter } from '../strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../strategy-library/domain/strategy';
import { createStrategyCertification } from '../strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../strategy-library/domain/strategy-eligibility';
import { createStrategyVersion } from '../strategy-library/domain/strategy-version';
import { InMemoryRuntimeValidationStore } from './in-memory-runtime-validation.store';
import { validateDeployment } from './domain/validate-deployment';
import { RuntimeEnforcementLibraryReadService } from './runtime-enforcement-library-read.service';
import { RuntimeValidationService } from './runtime-validation.service';
import type { RuntimeEnforcementPort } from './ports/runtime-enforcement.port';

const createdAt = '2026-08-15T12:00:00.000Z';
const certifiedAt = '2026-08-15T13:00:00.000Z';
const evaluatedAt = '2026-08-15T14:00:00.000Z';

function seedEligible(adapter: InMemoryStrategyLibraryReadAdapter) {
  const strategy = createStrategy({
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    workspaceId: 'ws-1',
    createdAt,
  });
  const version = createStrategyVersion({
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h'],
    supportedSymbols: ['BTCUSDT'],
    workspaceId: 'ws-1',
    createdAt,
  });
  const certification = createStrategyCertification({
    certificationId: 'cert-1',
    strategyVersion: version,
    certifiedBy: 'operator-alice',
    certifiedAt,
    evidence: [
      {
        evidenceId: 'ev-bt-1',
        type: 'backtesting',
        sourceRef: { owner: 'backtesting', id: 'bt-1' },
      },
      {
        evidenceId: 'ev-wf-1',
        type: 'walk-forward',
        sourceRef: { owner: 'walk-forward', id: 'wf-1' },
      },
    ],
    tacticalEnvelope: {
      envelopeVersion: 'env-1',
      allowedMarkets: ['crypto-spot'],
      allowedExchangeScopeIds: ['binance-spot'],
      allowedSymbols: ['BTCUSDT'],
      allowedTimeframes: ['1h'],
      riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
      maxPositions: { min: 1, max: 3 },
    },
  });
  const eligibility = createStrategyEligibility({
    eligibilityId: 'elig-1',
    certification,
    rulesVersion: 'rules-v1',
    evaluatedAt,
  });
  return adapter.seedEntry({ strategy, version, certification, eligibility });
}

function createService(adapter: InMemoryStrategyLibraryReadAdapter) {
  const reads = new RuntimeEnforcementLibraryReadService(adapter, adapter);
  const gate: RuntimeEnforcementPort = {
    validateDeployment: (cmd) =>
      validateDeployment(cmd, {
        getByLibraryEntryId: (id) => reads.getByLibraryEntryId(id),
        getByFamilyVersion: (familyId, version) => reads.getByFamilyVersion(familyId, version),
        familyExistsInWorkspace: (workspaceId, strategyFamilyId) =>
          reads.familyExistsInWorkspace(workspaceId, strategyFamilyId),
      }),
  };
  return new RuntimeValidationService(gate, reads, new InMemoryRuntimeValidationStore());
}

describe('RuntimeValidationService (PC-04)', () => {
  it('records PASS with Strategy Version snapshot from the existing Gate', () => {
    const library = new InMemoryStrategyLibraryReadAdapter();
    seedEligible(library);
    const service = createService(library);

    const record = service.run({
      workspaceId: 'ws-1',
      libraryEntryId: 'lib-entry-1',
      purpose: 'deployment_bind',
    });

    expect(record.outcome).toBe('pass');
    expect(record.validation).toBe('VALID');
    expect(record.reasons).toEqual([]);
    expect(record.progress).toBe('complete');
    expect(record.libraryEntryId).toBe('lib-entry-1');
    expect(record.strategyFamilyId).toBe('fam-momentum');
    expect(record.strategyVersion).toBe('1.0.0');
    expect(record.strategyName).toBe('Momentum');
    expect(record.checkedAt).toBeTruthy();
  });

  it('records FAIL with deterministic Gate reasons and history', () => {
    const library = new InMemoryStrategyLibraryReadAdapter();
    const service = createService(library);

    const failed = service.run({
      workspaceId: 'ws-1',
      strategyFamilyId: 'fam-missing',
      strategyVersion: '1.0.0',
      purpose: 'deployment_bind',
    });
    expect(failed.outcome).toBe('fail');
    expect(failed.validation).toBe('INVALID');
    expect(failed.reasons).toEqual(['strategy_not_found']);

    seedEligible(library);
    const passed = service.run({
      workspaceId: 'ws-1',
      libraryEntryId: 'lib-entry-1',
      purpose: 'deployment_bind',
    });
    expect(passed.outcome).toBe('pass');

    const history = service.listHistory({ workspaceId: 'ws-1' });
    expect(history.items.map((item) => item.outcome)).toEqual(['pass', 'fail']);
    expect(service.get(failed.validationId, 'ws-1')?.reasons).toEqual(['strategy_not_found']);
    expect(service.get(failed.validationId, 'ws-other')).toBeNull();
  });

  it('does not invent a soft-pass when identity is missing', () => {
    const service = createService(new InMemoryStrategyLibraryReadAdapter());
    const record = service.run({
      workspaceId: 'ws-1',
      purpose: 'deployment_bind',
    });
    expect(record.outcome).toBe('fail');
    expect(record.reasons).toEqual(['identity_ambiguous']);
  });
});
