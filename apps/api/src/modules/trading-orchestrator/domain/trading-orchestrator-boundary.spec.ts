import { describe, expect, it } from 'vitest';
import {
  TRADING_ORCHESTRATOR_AUTHORITY_CLASS,
  TRADING_ORCHESTRATOR_BOUNDARY,
  TRADING_ORCHESTRATOR_DISTINCT_FROM,
  TRADING_ORCHESTRATOR_FORBIDDEN_CAPABILITIES,
  TRADING_ORCHESTRATOR_MODULE_ID,
  TRADING_ORCHESTRATOR_NON_OWNED,
  TRADING_ORCHESTRATOR_OWNED_CONCERNS,
  isTradingOrchestratorForbiddenCapability,
  tradingOrchestratorApprovesRisk,
  tradingOrchestratorForcesTrade,
  tradingOrchestratorIsExecutionEngine,
  tradingOrchestratorIsExecutionSourceOfTruth,
  tradingOrchestratorOwnsMarketProfile,
  tradingOrchestratorOwnsMarketState,
  tradingOrchestratorOwnsQualification,
  tradingOrchestratorOwnsSessionLifecycle,
  tradingOrchestratorReplacesRuntimeEnforcement,
  tradingOrchestratorReplacesStrategyLibrary,
  tradingOrchestratorSubmitsOrders,
} from './trading-orchestrator-boundary';

describe('RC-26 Epic 5 — Trading Orchestrator boundary', () => {
  it('exposes orchestration_artifact boundary with Epic 5 ports active', () => {
    expect(Object.isFrozen(TRADING_ORCHESTRATOR_BOUNDARY)).toBe(true);
    expect(TRADING_ORCHESTRATOR_BOUNDARY.moduleId).toBe(TRADING_ORCHESTRATOR_MODULE_ID);
    expect(TRADING_ORCHESTRATOR_BOUNDARY.authorityClass).toBe(TRADING_ORCHESTRATOR_AUTHORITY_CLASS);
    expect(TRADING_ORCHESTRATOR_BOUNDARY.strategyLibraryRole).toBe('read-only-consumer');
    expect(TRADING_ORCHESTRATOR_BOUNDARY.runtimeEnforcementRole).toBe('gate-consumer');
    expect(TRADING_ORCHESTRATOR_BOUNDARY.riskEngineRole).toBe('policy-read-consumer');
    expect(TRADING_ORCHESTRATOR_BOUNDARY.marketStateRole).toBe('read-only-consumer');
    expect(TRADING_ORCHESTRATOR_BOUNDARY.tradingSessionRole).toBe('handoff-intent-emitter');
    expect(TRADING_ORCHESTRATOR_BOUNDARY.executionSourceOfTruth).toBe(false);
    expect(TRADING_ORCHESTRATOR_BOUNDARY.approvesRisk).toBe(false);
    expect(TRADING_ORCHESTRATOR_BOUNDARY.submitsOrders).toBe(false);
    expect(TRADING_ORCHESTRATOR_BOUNDARY.forcesTrade).toBe(false);
    expect(TRADING_ORCHESTRATOR_BOUNDARY.activePorts).toEqual({
      tradingOrchestratorService: true,
      tradingOrchestratorQuery: true,
      strategyLibraryConsumer: true,
      runtimeEnforcementConsumer: true,
      riskPolicyConsumer: true,
      marketStateConsumer: true,
      qualificationConsumer: false,
      profileConsumer: false,
      sessionHandoff: true,
      consumerRead: true,
      persistence: true,
      rest: true,
    });
  });

  it('owns plan/intent/lifecycle/metadata and workflow coordination concerns', () => {
    expect(TRADING_ORCHESTRATOR_OWNED_CONCERNS).toEqual(
      expect.arrayContaining([
        'orchestrator-boundary',
        'trading-orchestrator',
        'orchestration-plan',
        'orchestration-plan-version',
        'orchestration-intent',
        'orchestration-lifecycle',
        'orchestration-metadata',
        'orchestration-workflow',
        'orchestration-run',
        'coordination-pipeline',
        'execution-intent-sequencing',
        'selection-decision',
        'tactic-selection',
        'session-handoff-intent',
      ]),
    );
  });

  it('does not claim Library, Gate, Qualification, Profile, State, Session, Risk, Orders, Reporting, or AI', () => {
    expect(TRADING_ORCHESTRATOR_NON_OWNED).toEqual(
      expect.arrayContaining([
        'strategy-certification',
        'runtime-enforcement-gate',
        'qualification-decisions',
        'market-profile-versions',
        'market-state-ownership',
        'trading-session-lifecycle',
        'orders',
        'risk-decisions',
        'execution-engine',
        'reporting',
        'ai-analytics',
      ]),
    );
  });

  it('stays distinct from Market State, Execution Engine, Gate, and Library', () => {
    expect(TRADING_ORCHESTRATOR_DISTINCT_FROM).toEqual(
      expect.arrayContaining([
        'market-state',
        'market-qualification',
        'market-profile',
        'runtime-enforcement',
        'strategy-library',
        'execution-engine',
        'risk-engine',
        'trading-session',
      ]),
    );
    expect(TRADING_ORCHESTRATOR_MODULE_ID).not.toBe('market-state');
    expect(TRADING_ORCHESTRATOR_MODULE_ID).not.toBe('execution-engine');
    expect(TRADING_ORCHESTRATOR_MODULE_ID).not.toBe('runtime-enforcement');
  });

  it('forbids certification, soft-pass Gate, orders, risk approval, and Execution Engine identity', () => {
    for (const capability of [
      'certify-strategy',
      'invent-envelope-points',
      'soft-pass-enforcement-gate',
      'duplicate-validation-gate',
      'approve-risk',
      'submit-order',
      'submit-execution',
      'become-execution-engine',
      'generate-ai-trade-decision',
      'own-market-state',
    ] as const) {
      expect(isTradingOrchestratorForbiddenCapability(capability)).toBe(true);
      expect(TRADING_ORCHESTRATOR_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
  });

  it('never executes as SoT, never approves risk, never submits orders, never owns upstream SoTs', () => {
    expect(tradingOrchestratorIsExecutionSourceOfTruth()).toBe(false);
    expect(tradingOrchestratorForcesTrade()).toBe(false);
    expect(tradingOrchestratorApprovesRisk()).toBe(false);
    expect(tradingOrchestratorSubmitsOrders()).toBe(false);
    expect(tradingOrchestratorOwnsSessionLifecycle()).toBe(false);
    expect(tradingOrchestratorReplacesRuntimeEnforcement()).toBe(false);
    expect(tradingOrchestratorReplacesStrategyLibrary()).toBe(false);
    expect(tradingOrchestratorOwnsQualification()).toBe(false);
    expect(tradingOrchestratorOwnsMarketProfile()).toBe(false);
    expect(tradingOrchestratorOwnsMarketState()).toBe(false);
    expect(tradingOrchestratorIsExecutionEngine()).toBe(false);
  });
});
