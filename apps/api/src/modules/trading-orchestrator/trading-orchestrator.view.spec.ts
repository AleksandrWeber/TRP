import { describe, expect, it } from 'vitest';
import { createOrchestrationPlan } from './domain/orchestration-plan';
import { createOrchestrationRun } from './domain/orchestration-run';
import { toOrchestrationPlanView, toOrchestrationRunView } from './trading-orchestrator.view';

const asOf = '2026-08-15T12:00:00.000Z';

describe('PC-11 orchestration product views', () => {
  it('maps a plan with createsSession false and lifecycle visible', () => {
    const plan = createOrchestrationPlan({
      orchestrationPlanId: 'plan-1',
      tradingOrchestratorId: 'orch-default',
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      version: {
        orchestrationPlanId: 'plan-1',
        version: 1,
        publishedAt: asOf,
        publishedBy: 'trader-1',
      },
      lifecycle: {
        status: 'ready',
        updatedAt: asOf,
        updatedBy: 'trader-1',
        reason: 'orchestration plan ready',
      },
      intent: {
        objective: 'Select a certified paper tactic',
        rationaleSummary: 'Coordination only',
      },
      metadata: {
        asOf,
        inputSummary: 'binance-spot BTCUSDT paper coordination',
      },
    });
    const view = toOrchestrationPlanView(plan);
    expect(view.lifecycleStatus).toBe('ready');
    expect(view.createsSession).toBe(false);
    expect(view.forcesTrade).toBe(false);
    expect(view.objective).toBe('Select a certified paper tactic');
  });

  it('maps a run without Session ownership flags', () => {
    const run = createOrchestrationRun({
      orchestrationRunId: 'run-1',
      tradingOrchestratorId: 'orch-default',
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      marketStateId: 'ms-1',
      requestedBy: 'trader-1',
      createdAt: asOf,
    });
    const view = toOrchestrationRunView(run, 'plan-1');
    expect(view.orchestrationPlanId).toBe('plan-1');
    expect(view.ownsSessionLifecycle).toBe(false);
    expect(view.submitsOrders).toBe(false);
    expect(view.approvesRisk).toBe(false);
  });
});
