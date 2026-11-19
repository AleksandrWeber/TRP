import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { OrchestrationCoordinationStore } from './application/orchestration-coordination.store';
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

const DRIVER_KEYS = [
  'PERSISTENCE_DRIVER',
  'RESEARCH_PERSISTENCE_DRIVER',
  'W3_PERSISTENCE_DRIVER',
] as const;

describe('RC-26 Epic 6 — Trading Orchestrator Nest wiring', () => {
  it('wires Service/Query + consumer-read; REST is the product transport; persistence stays off', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const connect = vi.spyOn(PrismaClient.prototype, '$connect').mockImplementation(async () => {
      throw new Error('Trading Orchestrator module spec must not open a database connection');
    });
    const previous = Object.fromEntries(DRIVER_KEYS.map((key) => [key, process.env[key]]));
    delete process.env.PERSISTENCE_DRIVER;
    process.env.RESEARCH_PERSISTENCE_DRIVER = 'prisma';
    process.env.W3_PERSISTENCE_DRIVER = 'memory';
    try {
      const moduleRef = await Test.createTestingModule({
        imports: [TradingOrchestratorModule],
      }).compile();
      await moduleRef.init();

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
      expect(moduleRef.get(OrchestrationCoordinationStore).constructor).toBe(
        OrchestrationCoordinationStore,
      );

      const service = moduleRef.get<TradingOrchestratorServicePort>(
        TRADING_ORCHESTRATOR_SERVICE_PORT,
      );
      const query = moduleRef.get<TradingOrchestratorQueryPort>(TRADING_ORCHESTRATOR_QUERY_PORT);
      expect(typeof service.requestOrchestrationRun).toBe('function');
      expect(typeof service.proposeSelection).toBe('function');
      expect(typeof service.emitSessionHandoff).toBe('function');
      expect(typeof query.getOrchestrationRun).toBe('function');
      const missing = query.getOrchestrationRun({
        workspaceId: 'ws-1',
        orchestrationRunId: 'missing-run',
      });
      expect(missing).toBeNull();
      expect(missing).not.toBeInstanceOf(Promise);
      expect(connect).not.toHaveBeenCalled();

      await moduleRef.close();
    } finally {
      connect.mockRestore();
      for (const key of DRIVER_KEYS) {
        const prior = previous[key];
        if (prior === undefined) delete process.env[key];
        else process.env[key] = prior;
      }
    }
  });
});
