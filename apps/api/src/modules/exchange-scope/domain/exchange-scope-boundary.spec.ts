import { describe, expect, it } from 'vitest';
import {
  EXCHANGE_SCOPE_AUTHORITY_CLASS,
  EXCHANGE_SCOPE_BOUNDARY,
  EXCHANGE_SCOPE_DISTINCT_FROM,
  EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES,
  EXCHANGE_SCOPE_MODULE_ID,
  EXCHANGE_SCOPE_NON_OWNED,
  EXCHANGE_SCOPE_OWNED_CONCERNS,
  EXCHANGE_SCOPE_UI_ALIAS,
  exchangeScopeApprovesRisk,
  exchangeScopeForcesTrade,
  exchangeScopeIsExecutionEngine,
  exchangeScopeIsExecutionSourceOfTruth,
  exchangeScopeIsRiskEngine,
  exchangeScopeIsRuntime,
  exchangeScopeIsStrategyLibrary,
  exchangeScopeIsTradingSession,
  exchangeScopeOwnsSessionLifecycle,
  exchangeScopeOwnsStrategyCertification,
  exchangeScopeSubmitsOrders,
  isExchangeScopeForbiddenCapability,
} from './exchange-scope-boundary';

describe('RC-27 Epic 1 — Exchange Scope boundary', () => {
  it('exposes exchange_scope_artifact isolation boundary with application ports active', () => {
    expect(Object.isFrozen(EXCHANGE_SCOPE_BOUNDARY)).toBe(true);
    expect(EXCHANGE_SCOPE_BOUNDARY.moduleId).toBe(EXCHANGE_SCOPE_MODULE_ID);
    expect(EXCHANGE_SCOPE_BOUNDARY.uiAlias).toBe(EXCHANGE_SCOPE_UI_ALIAS);
    expect(EXCHANGE_SCOPE_BOUNDARY.authorityClass).toBe(EXCHANGE_SCOPE_AUTHORITY_CLASS);
    expect(EXCHANGE_SCOPE_BOUNDARY.isolationRole).toBe('isolation-boundary');
    expect(EXCHANGE_SCOPE_BOUNDARY.riskPolicyRole).toBe('policy-input-owner');
    expect(EXCHANGE_SCOPE_BOUNDARY.executionSourceOfTruth).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.approvesRisk).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.submitsOrders).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.isRuntime).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.isTradingSession).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.isExecutionEngine).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.isStrategyLibrary).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.isRiskEngine).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.forcesTrade).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.activePorts).toEqual({
      exchangeScopeService: true,
      exchangeScopeQuery: true,
      consumerRead: true,
      persistence: true,
      rest: false,
      transport: false,
    });
  });

  it('owns identity, config, context, lifecycle, account bindings, and policy inputs', () => {
    expect(EXCHANGE_SCOPE_OWNED_CONCERNS).toEqual(
      expect.arrayContaining([
        'exchange-scope-boundary',
        'exchange-scope-identity',
        'exchange-scope',
        'exchange-scope-version',
        'exchange-scope-config',
        'exchange-scope-lifecycle',
        'exchange-scope-context',
        'exchange-scope-metadata',
        'exchange-risk-policy-inputs',
        'trading-account-binding',
        'adapter-binding-context',
      ]),
    );
  });

  it('does not claim Library, Gate, Qualification, Profile, State, Orchestrator, Session, Orders, Execution, Accounting, or Reporting', () => {
    expect(EXCHANGE_SCOPE_NON_OWNED).toEqual(
      expect.arrayContaining([
        'strategy-library',
        'runtime-enforcement',
        'market-qualification',
        'market-profile',
        'market-state',
        'trading-orchestrator',
        'trading-session',
        'orders',
        'execution-engine',
        'accounting',
        'reporting',
        'risk-engine',
        'knowledge-lake',
      ]),
    );
  });

  it('stays distinct from Runtime, Session, Execution Engine, and Strategy Library', () => {
    expect(EXCHANGE_SCOPE_DISTINCT_FROM).toEqual(
      expect.arrayContaining([
        'strategy-runtime',
        'trading-session',
        'execution-engine',
        'strategy-library',
        'runtime-enforcement',
        'risk-engine',
      ]),
    );
    expect(EXCHANGE_SCOPE_MODULE_ID).not.toBe('strategy-runtime');
    expect(EXCHANGE_SCOPE_MODULE_ID).not.toBe('trading-session');
    expect(EXCHANGE_SCOPE_MODULE_ID).not.toBe('execution-engine');
    expect(EXCHANGE_SCOPE_MODULE_ID).not.toBe('strategy-library');
  });

  it('forbids becoming engines, cloning stacks, and trading-path authority', () => {
    for (const capability of [
      'become-runtime',
      'become-trading-session',
      'become-execution-engine',
      'become-strategy-library',
      'clone-risk-engine',
      'clone-orders',
      'clone-execution',
      'approve-risk',
      'submit-order',
      'own-trading-session-lifecycle',
      'pick-another-exchange-on-ambiguity',
      'become-execution-source-of-truth',
    ] as const) {
      expect(isExchangeScopeForbiddenCapability(capability)).toBe(true);
      expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
  });

  it('never executes as SoT, never risks, never is Runtime/Session/Library/Execution', () => {
    expect(exchangeScopeIsExecutionSourceOfTruth()).toBe(false);
    expect(exchangeScopeApprovesRisk()).toBe(false);
    expect(exchangeScopeSubmitsOrders()).toBe(false);
    expect(exchangeScopeIsRuntime()).toBe(false);
    expect(exchangeScopeIsTradingSession()).toBe(false);
    expect(exchangeScopeIsExecutionEngine()).toBe(false);
    expect(exchangeScopeIsStrategyLibrary()).toBe(false);
    expect(exchangeScopeIsRiskEngine()).toBe(false);
    expect(exchangeScopeForcesTrade()).toBe(false);
    expect(exchangeScopeOwnsSessionLifecycle()).toBe(false);
    expect(exchangeScopeOwnsStrategyCertification()).toBe(false);
  });
});
