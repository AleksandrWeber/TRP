import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { InMemoryStrategyLibraryReadAdapter } from '../strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../strategy-library/domain/strategy';
import { createStrategyCertification } from '../strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../strategy-library/domain/strategy-eligibility';
import { deprecateStrategyCertification } from '../strategy-library/domain/strategy-lifecycle';
import { createStrategyVersion } from '../strategy-library/domain/strategy-version';
import type { RuntimeEnforcementPort } from './ports/runtime-enforcement.port';
import { RUNTIME_ENFORCEMENT_PORT } from './ports/runtime-enforcement.port';
import { RuntimeEnforcementModule } from './runtime-enforcement.module';

const createdAt = '2026-08-10T12:00:00.000Z';
const certifiedAt = '2026-08-10T13:00:00.000Z';
const evaluatedAt = '2026-08-10T14:00:00.000Z';
const checkedAt = '2026-08-10T16:00:00.000Z';

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
    supportedTimeframes: ['1h', '4h'],
    supportedSymbols: ['BTCUSDT', 'ETHUSDT'],
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
      allowedSymbols: ['BTCUSDT', 'ETHUSDT'],
      allowedTimeframes: ['1h', '4h'],
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

describe('RC-23 Epic 3 — RuntimeEnforcementPort Nest integration', () => {
  it('wires validateDeployment and returns VALID for eligible Library member', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RuntimeEnforcementModule],
    }).compile();

    const adapter = moduleRef.get(InMemoryStrategyLibraryReadAdapter);
    seedEligible(adapter);
    const gate = moduleRef.get<RuntimeEnforcementPort>(RUNTIME_ENFORCEMENT_PORT);

    const decision = gate.validateDeployment({
      workspaceId: 'ws-1',
      libraryEntryId: 'lib-entry-1',
      purpose: 'deployment_bind',
      requestedAt: checkedAt,
    });

    expect(decision.validation).toBe('VALID');
    expect(decision.outcome).toBe('pass');
    expect(decision.reasons).toEqual([]);

    await moduleRef.close();
  });

  it('returns INVALID with deterministic reasons for failure modes', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RuntimeEnforcementModule],
    }).compile();

    const adapter = moduleRef.get(InMemoryStrategyLibraryReadAdapter);
    const gate = moduleRef.get<RuntimeEnforcementPort>(RUNTIME_ENFORCEMENT_PORT);

    // missing strategy
    expect(
      gate.validateDeployment({
        workspaceId: 'ws-1',
        strategyFamilyId: 'fam-x',
        strategyVersion: '1.0.0',
        purpose: 'deployment_bind',
        requestedAt: checkedAt,
      }).reasons,
    ).toEqual(['strategy_not_found']);

    // seed family then missing version
    seedEligible(adapter);
    expect(
      gate.validateDeployment({
        workspaceId: 'ws-1',
        strategyFamilyId: 'fam-momentum',
        strategyVersion: '2.0.0',
        purpose: 'deployment_bind',
        requestedAt: checkedAt,
      }).reasons,
    ).toEqual(['strategy_version_not_found']);

    // missing eligibility
    adapter.clear();
    const strategy = createStrategy({
      strategyFamilyId: 'fam-momentum',
      name: 'Momentum',
      workspaceId: 'ws-1',
      createdAt,
    });
    const version = createStrategyVersion({
      libraryEntryId: 'lib-entry-2',
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
      certificationId: 'cert-2',
      strategyVersion: version,
      certifiedBy: 'operator-alice',
      certifiedAt,
      evidence: [
        {
          evidenceId: 'ev-bt-2',
          type: 'backtesting',
          sourceRef: { owner: 'backtesting', id: 'bt-2' },
        },
        {
          evidenceId: 'ev-wf-2',
          type: 'walk-forward',
          sourceRef: { owner: 'walk-forward', id: 'wf-2' },
        },
      ],
      tacticalEnvelope: {
        envelopeVersion: 'env-2',
        allowedMarkets: ['crypto-spot'],
        allowedExchangeScopeIds: ['binance-spot'],
        allowedSymbols: ['BTCUSDT'],
        allowedTimeframes: ['1h'],
        riskPerTrade: { min: 0.25, max: 1 },
        maxPositions: { min: 1, max: 2 },
      },
    });
    adapter.seedEntry({ strategy, version, certification, eligibility: null });
    expect(
      gate.validateDeployment({
        workspaceId: 'ws-1',
        libraryEntryId: 'lib-entry-2',
        purpose: 'deployment_bind',
        requestedAt: checkedAt,
      }).reasons,
    ).toEqual(['eligibility_missing']);

    // inactive certification
    adapter.clear();
    const v3 = createStrategyVersion({
      libraryEntryId: 'lib-entry-3',
      strategyFamilyId: 'fam-momentum',
      version: '3.0.0',
      contentHash: 'sha256:def',
      market: 'crypto-spot',
      supportedExchangeScopeIds: ['binance-spot'],
      supportedTimeframes: ['1h'],
      supportedSymbols: ['BTCUSDT'],
      workspaceId: 'ws-1',
      createdAt,
    });
    const active = createStrategyCertification({
      certificationId: 'cert-3',
      strategyVersion: v3,
      certifiedBy: 'operator-alice',
      certifiedAt,
      evidence: [
        {
          evidenceId: 'ev-bt-3',
          type: 'backtesting',
          sourceRef: { owner: 'backtesting', id: 'bt-3' },
        },
        {
          evidenceId: 'ev-wf-3',
          type: 'walk-forward',
          sourceRef: { owner: 'walk-forward', id: 'wf-3' },
        },
      ],
      tacticalEnvelope: {
        envelopeVersion: 'env-3',
        allowedMarkets: ['crypto-spot'],
        allowedExchangeScopeIds: ['binance-spot'],
        allowedSymbols: ['BTCUSDT'],
        allowedTimeframes: ['1h'],
        riskPerTrade: { min: 0.25, max: 1 },
        maxPositions: { min: 1, max: 2 },
      },
    });
    const { certification: deprecated } = deprecateStrategyCertification({
      lifecycleRecordId: 'lc-3',
      certification: active,
      reason: 'done',
      deprecatedBy: 'operator-alice',
      deprecatedAt: '2026-08-10T15:00:00.000Z',
    });
    adapter.seedEntry({
      strategy: createStrategy({
        strategyFamilyId: 'fam-momentum',
        name: 'Momentum',
        workspaceId: 'ws-1',
        createdAt,
      }),
      version: v3,
      certification: deprecated,
    });
    expect(
      gate.validateDeployment({
        workspaceId: 'ws-1',
        libraryEntryId: 'lib-entry-3',
        purpose: 'session_start',
        requestedAt: checkedAt,
      }).reasons,
    ).toEqual(['certification_deprecated']);

    await moduleRef.close();
  });

  it('does not touch Session/Deployment modules', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RuntimeEnforcementModule],
    }).compile();

    const gate = moduleRef.get<RuntimeEnforcementPort>(RUNTIME_ENFORCEMENT_PORT);
    expect(gate).not.toHaveProperty('startSession');
    expect(gate).not.toHaveProperty('bindDeployment');
    expect(gate).not.toHaveProperty('rejectDeployment');

    await moduleRef.close();
  });
});
