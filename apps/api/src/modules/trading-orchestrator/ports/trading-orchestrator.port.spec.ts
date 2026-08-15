import { describe, expect, it } from 'vitest';
import {
  ORCHESTRATOR_MARKET_STATE_CONSUMER,
  ORCHESTRATOR_PROFILE_CONSUMER,
  ORCHESTRATOR_QUALIFICATION_CONSUMER,
  ORCHESTRATOR_RISK_POLICY_READ_CONSUMER,
  ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER,
  ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER,
  TRADING_ORCHESTRATOR_CONSUMER_READ_PORT,
  TRADING_ORCHESTRATOR_PORTS_ACTIVE,
  TRADING_ORCHESTRATOR_QUERY_PORT,
  TRADING_ORCHESTRATOR_SERVICE_PORT,
} from './trading-orchestrator.port';

describe('RC-26 Epic 5 — Trading Orchestrator ports posture', () => {
  it('activates service/query + coordination + consumer-read + REST; keeps persistence inactive', () => {
    expect(typeof TRADING_ORCHESTRATOR_SERVICE_PORT).toBe('symbol');
    expect(typeof TRADING_ORCHESTRATOR_QUERY_PORT).toBe('symbol');
    expect(typeof ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER).toBe('symbol');
    expect(typeof ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER).toBe('symbol');
    expect(typeof ORCHESTRATOR_RISK_POLICY_READ_CONSUMER).toBe('symbol');
    expect(typeof ORCHESTRATOR_MARKET_STATE_CONSUMER).toBe('symbol');
    expect(typeof ORCHESTRATOR_QUALIFICATION_CONSUMER).toBe('symbol');
    expect(typeof ORCHESTRATOR_PROFILE_CONSUMER).toBe('symbol');
    expect(typeof TRADING_ORCHESTRATOR_CONSUMER_READ_PORT).toBe('symbol');
    expect(TRADING_ORCHESTRATOR_PORTS_ACTIVE).toEqual({
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
      persistence: false,
      rest: true,
    });
  });

  it('does not export forbidden behavioural helpers on the ports module', async () => {
    const ports = await import('./trading-orchestrator.port');
    expect(ports).not.toHaveProperty('certifyStrategy');
    expect(ports).not.toHaveProperty('approveRisk');
    expect(ports).not.toHaveProperty('submitOrder');
    expect(ports).not.toHaveProperty('submitExecution');
    expect(ports).not.toHaveProperty('softPassEnforcement');
    expect(ports).not.toHaveProperty('inventEnvelopePoint');
    expect(ports).not.toHaveProperty('createTradingSession');
  });
});
