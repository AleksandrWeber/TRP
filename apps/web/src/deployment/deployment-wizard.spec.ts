import { describe, expect, it } from 'vitest';
import type { StrategyLibraryRecordView } from '../shared/api';
import {
  allowedSymbols,
  allowedTimeframes,
  buildCreateDeploymentRequest,
  deploymentStatusLabel,
  draftFromEntry,
  gateOutcomeLabel,
  nextWizardStep,
  PAPER_DEPLOYMENT_DEFAULTS,
  previousWizardStep,
} from './deployment-wizard';

const entry: StrategyLibraryRecordView = {
  authorityClass: 'source_of_truth',
  membershipStatus: 'certified',
  strategy: {
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    description: null,
    registryRef: 'st-1',
    workspaceId: 'ws-1',
    createdAt: '2026-08-15T12:00:00.000Z',
  },
  version: {
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h', '4h'],
    supportedUniverse: { kind: 'symbols', symbols: ['BTCUSDT', 'ETHUSDT'] },
    workspaceId: 'ws-1',
    createdAt: '2026-08-15T12:00:00.000Z',
    immutable: true,
  },
  certification: null,
  eligibility: null,
  tacticalEnvelope: {
    envelopeVersion: 'env-1',
    allowedMarkets: ['crypto-spot'],
    allowedExchangeScopeIds: ['binance-spot'],
    allowedSymbols: ['BTCUSDT'],
    allowedTimeframes: ['1h'],
    riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
    maxPositions: { min: 1, max: 3 },
    parameterLimits: {},
    executionConstraints: null,
    optionalFilters: [],
    provenanceRefs: [],
  },
  envelopeState: 'present',
};

describe('Deployment helpers (PC-03)', () => {
  it('walks wizard steps without auto-approve', () => {
    expect(nextWizardStep('version')).toBe('point');
    expect(nextWizardStep('point')).toBe('confirm');
    expect(previousWizardStep('confirm')).toBe('point');
  });

  it('prefers envelope symbols and timeframes', () => {
    expect(allowedSymbols(entry)).toEqual(['BTCUSDT']);
    expect(allowedTimeframes(entry)).toEqual(['1h']);
    expect(draftFromEntry(entry).instrument).toBe('BTCUSDT');
  });

  it('builds create over existing Deployment fields with Library identity', () => {
    const request = buildCreateDeploymentRequest({
      entry,
      instrument: 'btcusdt',
      timeframe: '1h',
      notes: 'Paper bind',
    });
    expect(request.strategyId).toBe('st-1');
    expect(request.strategyVersion).toBe('1.0.0');
    expect(request.libraryEntryId).toBe('lib-entry-1');
    expect(request.instrument).toBe('BTCUSDT');
    expect(request.marketDataSourceId).toBe(PAPER_DEPLOYMENT_DEFAULTS.marketDataSourceId);
    expect(request).not.toHaveProperty('automatic');
    expect(request).not.toHaveProperty('sessionId');
    expect(request).not.toHaveProperty('startSession');
  });

  it('requires a research registry reference', () => {
    expect(() =>
      buildCreateDeploymentRequest({
        entry: { ...entry, strategy: { ...entry.strategy, registryRef: null } },
        instrument: 'BTCUSDT',
        timeframe: '1h',
        notes: '',
      }),
    ).toThrow(/registry reference/);
  });

  it('labels draft / approved and Gate PASS', () => {
    expect(deploymentStatusLabel('draft')).toBe('Draft');
    expect(deploymentStatusLabel('approved')).toBe('Approved');
    expect(gateOutcomeLabel({ outcome: 'pass', validation: 'VALID' })).toBe('PASS');
    expect(gateOutcomeLabel(null)).toBe('Not recorded');
  });
});
