import { describe, expect, it } from 'vitest';
import type { StrategyDeploymentView } from '../shared/api';
import {
  approvedDeployments,
  buildCreatePaperAccountRequest,
  buildCreateTradingSessionRequest,
  createBotReady,
  nextCreateBotStep,
} from './create-bot-wizard';
import { matchOrchestrationReference } from './orchestration-reference';
import type { OrchestrationRunDetailView } from '../shared/api';

const approved: StrategyDeploymentView = {
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
  metadata: {},
  enforcementAuthorization: {
    outcome: 'pass',
    validation: 'VALID',
    purpose: 'deployment_bind',
    libraryEntryId: 'lib-entry-1',
    certificationStatus: 'active',
    eligibilityOutcome: 'eligible',
    checkedAt: '2026-08-15T16:00:00.000Z',
    reasons: [],
  },
};

describe('PC-13 create bot wizard', () => {
  it('only offers approved Deployments and builds Session create over existing ports', () => {
    const draft = approvedDeployments([
      approved,
      { ...approved, id: 'dep-draft', status: 'draft' },
    ]);
    expect(draft.map((item) => item.id)).toEqual(['dep-1']);
    expect(nextCreateBotStep('deployment')).toBe('account');
    const ready = {
      deployment: approved,
      currency: 'USDT',
      openingCapital: '100000',
    };
    expect(createBotReady(ready)).toBe(true);
    expect(buildCreatePaperAccountRequest(ready).mode).toBe('paper');
    expect(buildCreateTradingSessionRequest(ready, 'acct-1')).toEqual({
      paperAccountId: 'acct-1',
      deploymentId: 'dep-1',
      origin: 'strategy',
      idempotencyKey: 'cc-session:dep-1:acct-1',
    });
    expect(buildCreateTradingSessionRequest(ready, 'acct-1', 'handoff-1')).toEqual({
      paperAccountId: 'acct-1',
      deploymentId: 'dep-1',
      origin: 'strategy',
      idempotencyKey: 'handoff:handoff-1',
      sessionHandoffIntentId: 'handoff-1',
    });
  });

  it('matches orchestration reference without claiming Session creation', () => {
    const details: OrchestrationRunDetailView[] = [
      {
        orchestrationRunId: 'run-1',
        workspaceId: 'ws-1',
        exchangeScopeId: 'binance-spot',
        marketSymbol: 'BTCUSDT',
        modeContext: 'paper',
        status: 'completed',
        marketStateId: 'ms-1',
        orchestrationPlanId: 'plan-1',
        selectionDecisionId: 'sel-1',
        sessionHandoffIntentId: 'handoff-1',
        objective: 'paper',
        rejectionReasons: [],
        requiresConfirmation: false,
        createdAt: '2026-08-15T16:00:00.000Z',
        updatedAt: '2026-08-15T16:00:00.000Z',
        authorityClass: 'orchestration_artifact',
        forcesTrade: false,
        approvesRisk: false,
        submitsOrders: false,
        ownsSessionLifecycle: false,
        selection: null,
        handoff: {
          sessionHandoffIntentId: 'handoff-1',
          orchestrationRunId: 'run-1',
          selectionDecisionId: 'sel-1',
          workspaceId: 'ws-1',
          deploymentBindRef: 'dep-1',
          enforcementDecisionRef: 'gate-1',
          status: 'emitted',
          proposedAt: '2026-08-15T16:00:00.000Z',
          authorityClass: 'orchestration_artifact',
          isOrder: false,
          isRiskDecision: false,
          createsSession: false,
        },
      },
    ];
    expect(matchOrchestrationReference(details, 'dep-1')).toEqual({
      orchestrationRunId: 'run-1',
      sessionHandoffIntentId: 'handoff-1',
      createsSession: false,
    });
    expect(matchOrchestrationReference(details, 'other')).toBeNull();
  });
});
