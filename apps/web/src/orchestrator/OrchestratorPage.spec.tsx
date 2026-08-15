import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type {
  OrchestrationPlanView,
  OrchestrationRunDetailView,
  StrategyDeploymentView,
  StrategyLibraryRecordView,
} from '../shared/api';
import { OrchestratorHistoryView } from './OrchestratorHistoryView';
import { OrchestratorPlanDetailView, OrchestratorPlansView } from './OrchestratorPlansView';
import { OrchestratorRunView } from './OrchestratorRunView';
import { OrchestratorWizardView } from './OrchestratorWizardView';
import type { OrchestratorWizardDraft } from './orchestration-wizard';

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

const draft: OrchestratorWizardDraft = {
  marketSymbol: 'BTCUSDT',
  exchangeScopeId: 'binance-spot',
  objective: 'Coordinate a certified paper selection',
  entry,
  deployment,
  timeframe: '1h',
};

const plan: OrchestrationPlanView = {
  orchestrationPlanId: 'plan-1',
  tradingOrchestratorId: 'orch-default',
  workspaceId: 'ws-1',
  exchangeScopeId: 'binance-spot',
  marketSymbol: 'BTCUSDT',
  modeContext: 'paper',
  version: 1,
  publishedAt: '2026-08-15T16:00:00.000Z',
  publishedBy: 'trader-1',
  lifecycleStatus: 'ready',
  lifecycleUpdatedAt: '2026-08-15T16:00:00.000Z',
  lifecycleReason: 'orchestration plan ready',
  objective: 'Coordinate a certified paper selection',
  rationaleSummary: 'Paper coordination request. Does not start a Session.',
  inputSummary: 'binance-spot BTCUSDT paper coordination',
  authorityClass: 'orchestration_artifact',
  createsSession: false,
  forcesTrade: false,
  submitsOrders: false,
  approvesRisk: false,
};

const run: OrchestrationRunDetailView = {
  orchestrationRunId: 'run-1',
  workspaceId: 'ws-1',
  exchangeScopeId: 'binance-spot',
  marketSymbol: 'BTCUSDT',
  modeContext: 'paper',
  status: 'handed_off',
  marketStateId: 'ms-1',
  orchestrationPlanId: 'plan-1',
  selectionDecisionId: 'sel-1',
  sessionHandoffIntentId: 'handoff-1',
  objective: 'Coordinate a certified paper selection',
  rejectionReasons: [],
  requiresConfirmation: false,
  createdAt: '2026-08-15T16:00:00.000Z',
  updatedAt: '2026-08-15T16:01:00.000Z',
  authorityClass: 'orchestration_artifact',
  forcesTrade: false,
  approvesRisk: false,
  submitsOrders: false,
  ownsSessionLifecycle: false,
  selection: {
    selectionDecisionId: 'sel-1',
    orchestrationRunId: 'run-1',
    workspaceId: 'ws-1',
    libraryEntryId: 'lib-entry-1',
    strategyVersionId: '1.0.0',
    envelopeVersion: 'env-1',
    tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h' },
    selectedAt: '2026-08-15T16:00:30.000Z',
    authorityClass: 'orchestration_artifact',
    forcesTrade: false,
    inventsStrategy: false,
  },
  handoff: {
    sessionHandoffIntentId: 'handoff-1',
    orchestrationRunId: 'run-1',
    selectionDecisionId: 'sel-1',
    workspaceId: 'ws-1',
    deploymentBindRef: 'dep-1',
    enforcementDecisionRef: 'enf-1',
    status: 'proposed',
    proposedAt: '2026-08-15T16:01:00.000Z',
    authorityClass: 'orchestration_artifact',
    isOrder: false,
    isRiskDecision: false,
    createsSession: false,
  },
};

function wrap(node: ReactNode) {
  return renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);
}

describe('PC-11 Orchestrator pages', () => {
  it('shows plan, selection, and confirm without starting a Session', () => {
    const confirm = wrap(
      <OrchestratorWizardView
        step="confirm"
        draft={draft}
        entries={[entry]}
        deployments={[deployment]}
        loading={false}
        submitting={false}
        progress={null}
        error={null}
        onMarketSymbol={() => undefined}
        onExchangeScope={() => undefined}
        onObjective={() => undefined}
        onSelectEntry={() => undefined}
        onSelectDeployment={() => undefined}
        onTimeframe={() => undefined}
        onBack={() => undefined}
        onNext={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(confirm).toContain('Emit handoff intent');
    expect(confirm).toContain('Creates Session');
    expect(confirm).toContain('false');
    expect(confirm).not.toContain('Start session');
    expect(confirm).not.toContain('Coming Soon');
  });

  it('lists plans and history and shows handoff preview', () => {
    const plans = wrap(<OrchestratorPlansView items={[plan]} loading={false} error={null} />);
    expect(plans).toContain('BTCUSDT');
    expect(plans).toContain('Ready');
    const history = wrap(<OrchestratorHistoryView items={[run]} loading={false} error={null} />);
    expect(history).toContain('Handoff intent emitted');
    const detail = wrap(<OrchestratorRunView record={run} loading={false} error={null} />);
    expect(detail).toContain('Session Handoff Intent');
    expect(detail).toContain('Creates Session');
    expect(detail).not.toContain('Start session');
    const planDetail = wrap(
      <OrchestratorPlanDetailView record={plan} loading={false} error={null} />,
    );
    expect(planDetail).toContain('createsSession remains false');
  });
});
