import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import {
  TRADING_ORCHESTRATOR_BOUNDARY,
  TRADING_ORCHESTRATOR_MODULE_ID,
} from './domain/trading-orchestrator-boundary';
import {
  ORCHESTRATOR_MARKET_STATE_CONSUMER,
  ORCHESTRATOR_RISK_POLICY_READ_CONSUMER,
  ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER,
  ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER,
  TRADING_ORCHESTRATOR_CONSUMER_READ_PORT,
  TRADING_ORCHESTRATOR_QUERY_PORT,
  TRADING_ORCHESTRATOR_SERVICE_PORT,
  type TradingOrchestratorQueryPort,
  type TradingOrchestratorServicePort,
} from './ports/trading-orchestrator.port';
import { TradingOrchestratorBoundaryService } from './trading-orchestrator-boundary.service';
import { TradingOrchestratorModule } from './trading-orchestrator.module';

describe('RC-26 Epic 6 — Trading Orchestrator Nest wiring', () => {
  it('wires Service/Query + consumer-read; REST is the product transport; persistence stays off', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TradingOrchestratorModule],
    }).compile();

    const boundary = moduleRef.get(TradingOrchestratorBoundaryService);
    expect(boundary.getBoundary()).toBe(TRADING_ORCHESTRATOR_BOUNDARY);
    expect(boundary.getBoundary().moduleId).toBe(TRADING_ORCHESTRATOR_MODULE_ID);
    expect(boundary.getBoundary().activePorts.tradingOrchestratorService).toBe(true);
    expect(boundary.getBoundary().activePorts.tradingOrchestratorQuery).toBe(true);
    expect(boundary.getBoundary().activePorts.consumerRead).toBe(true);
    expect(boundary.getBoundary().activePorts.persistence).toBe(true);
    expect(boundary.getBoundary().activePorts.rest).toBe(true);
    expect(boundary.approvesRisk()).toBe(false);
    expect(boundary.submitsOrders()).toBe(false);
    expect(boundary.isExecutionEngine()).toBe(false);
    expect(boundary.replacesRuntimeEnforcement()).toBe(false);

    expect(moduleRef.get(TRADING_ORCHESTRATOR_SERVICE_PORT)).toBeDefined();
    expect(moduleRef.get(TRADING_ORCHESTRATOR_QUERY_PORT)).toBeDefined();
    expect(moduleRef.get(ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER)).toBeDefined();
    expect(moduleRef.get(ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER)).toBeDefined();
    expect(moduleRef.get(ORCHESTRATOR_RISK_POLICY_READ_CONSUMER)).toBeDefined();
    expect(moduleRef.get(ORCHESTRATOR_MARKET_STATE_CONSUMER)).toBeDefined();
    expect(moduleRef.get(TRADING_ORCHESTRATOR_CONSUMER_READ_PORT)).toBeDefined();

    const service = moduleRef.get<TradingOrchestratorServicePort>(
      TRADING_ORCHESTRATOR_SERVICE_PORT,
    );
    const query = moduleRef.get<TradingOrchestratorQueryPort>(TRADING_ORCHESTRATOR_QUERY_PORT);
    expect(typeof service.requestOrchestrationRun).toBe('function');
    expect(typeof service.proposeSelection).toBe('function');
    expect(typeof service.emitSessionHandoff).toBe('function');
    expect(typeof query.getOrchestrationRun).toBe('function');

    await moduleRef.close();
  });
});
