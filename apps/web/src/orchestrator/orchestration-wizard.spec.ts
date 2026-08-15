import { describe, expect, it } from 'vitest';
import type { StrategyDeploymentView, StrategyLibraryRecordView } from '../shared/api';
import {
  approvedDeployments,
  buildCreatePlanRequest,
  buildEmitHandoffBody,
  buildProposeSelectionBody,
  draftFromEntry,
  INITIAL_ORCHESTRATOR_DRAFT,
  nextOrchestratorStep,
  planComplete,
  previousOrchestratorStep,
  selectionComplete,
} from './orchestration-wizard';

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
    supportedTimeframes: ['1h'],
    supportedUniverse: { kind: 'symbols', symbols: ['BTCUSDT'] },
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

const deployment: StrategyDeploymentView = {
  id: 'dep-1',
  workspaceId: 'ws-1',
  exchangeScopeId: 'binance-spot',
  strategyId: 'st-1',
  strategyVersion: '1.0.0',
  libraryEntryId: 'lib-entry-1',
  experimentId: null,
  parameters: {},
  instrument: 'BTCUSDT',
  timeframe: '1h',
  marketDataSourceId: 'binance-spot',
  paperExecutionConfigurationId: 'paper-config-us167',
  riskPolicyId: 'm2-baseline-paper-risk',
  riskPolicyVersion: 1,
  configurationHash: 'abc',
  status: 'approved',
  version: 1,
  approvedAt: '2026-08-15T16:00:00.000Z',
  approvedByActorId: 'trader-1',
  createdAt: '2026-08-15T16:00:00.000Z',
  recordedAt: '2026-08-15T16:00:00.000Z',
  actorId: 'trader-1',
  correlationId: null,
  metadata: { strategyName: 'Momentum' },
  enforcementAuthorization: null,
};

describe('orchestrator wizard helpers', () => {
  it('advances plan → selection → confirm', () => {
    expect(nextOrchestratorStep('plan')).toBe('selection');
    expect(nextOrchestratorStep('selection')).toBe('confirm');
    expect(previousOrchestratorStep('confirm')).toBe('selection');
  });

  it('builds paper plan and selection without live or session start', () => {
    const drafted = {
      ...draftFromEntry(INITIAL_ORCHESTRATOR_DRAFT, entry),
      deployment,
      objective: 'Coordinate a certified paper selection',
    };
    expect(planComplete(drafted)).toBe(true);
    expect(selectionComplete(drafted)).toBe(true);
    expect(buildCreatePlanRequest(drafted)).toEqual({
      marketSymbol: 'BTCUSDT',
      exchangeScopeId: 'binance-spot',
      modeContext: 'paper',
      objective: 'Coordinate a certified paper selection',
      rationaleSummary: 'Paper coordination request. Does not start a Session.',
    });
    expect(buildProposeSelectionBody(drafted).envelopeVersion).toBe('env-1');
    expect(buildEmitHandoffBody('sel-1', 'dep-1').deploymentBindRef).toBe('dep-1');
  });

  it('only orchestrates approved Deployments', () => {
    expect(approvedDeployments([{ ...deployment, status: 'draft' }, deployment])).toEqual([
      deployment,
    ]);
  });
});
