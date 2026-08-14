import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CANONICAL_ORDER_PATH_PORT } from '../modules/canonical-order-path/canonical-order-path.service';
import { KNOWLEDGE_LAKE_INGESTION_PORT } from '../modules/knowledge-lake/ports/knowledge-lake-ingestion.port';
import { KNOWLEDGE_LAKE_QUERY_PORT } from '../modules/knowledge-lake/ports/knowledge-lake-query.port';
import { NOTIFICATION_SERVICE_PORT } from '../modules/notification-delivery/ports/notification.port';
import {
  REPORTING_QUERY_PORT,
  REPORTING_SERVICE_PORT,
} from '../modules/reporting/ports/reporting.port';
import { RUNTIME_ENFORCEMENT_PORT } from '../modules/runtime-enforcement/ports/runtime-enforcement.port';
import { STRATEGY_LIBRARY_ELIGIBILITY_PORT } from '../modules/strategy-library/ports/strategy-library-eligibility.port';
import { STRATEGY_LIBRARY_LOOKUP_PORT } from '../modules/strategy-library/ports/strategy-library-lookup.port';
import { TRADING_ORCHESTRATOR_SERVICE_PORT } from '../modules/trading-orchestrator/ports/trading-orchestrator.port';
import { AI_ANALYTICS_PORT } from '../modules/ai-analytics/ports/ai-analytics.port';
import { V2_WORKFLOW_CONTRACT_FILES, V2_WORKFLOW_HOPS } from './v2-workflow-graph';

const API_ROOT = process.cwd();

describe('RC-28 Epic 2 — contract usage', () => {
  it('binds every hop to an existing application-port file', () => {
    for (const hop of V2_WORKFLOW_HOPS) {
      const relative =
        V2_WORKFLOW_CONTRACT_FILES[hop.portToken as keyof typeof V2_WORKFLOW_CONTRACT_FILES];
      expect(relative, hop.hopId).toBeTruthy();
      expect(existsSync(join(API_ROOT, relative))).toBe(true);
      const source = readFileSync(join(API_ROOT, relative), 'utf8');
      expect(source).toContain(hop.portToken);
    }
  });

  it('exposes the frozen Nest tokens used by the certified path', () => {
    expect(typeof STRATEGY_LIBRARY_LOOKUP_PORT).toBe('symbol');
    expect(typeof STRATEGY_LIBRARY_ELIGIBILITY_PORT).toBe('symbol');
    expect(typeof RUNTIME_ENFORCEMENT_PORT).toBe('symbol');
    expect(typeof TRADING_ORCHESTRATOR_SERVICE_PORT).toBe('symbol');
    expect(typeof CANONICAL_ORDER_PATH_PORT).toBe('symbol');
    expect(typeof KNOWLEDGE_LAKE_INGESTION_PORT).toBe('symbol');
    expect(typeof KNOWLEDGE_LAKE_QUERY_PORT).toBe('symbol');
    expect(typeof REPORTING_SERVICE_PORT).toBe('symbol');
    expect(typeof REPORTING_QUERY_PORT).toBe('symbol');
    expect(typeof AI_ANALYTICS_PORT).toBe('symbol');
    expect(typeof NOTIFICATION_SERVICE_PORT).toBe('symbol');
  });

  it('wires Gate consume of Library and Orchestrator consume of Gate in Nest modules', () => {
    const enforcementModule = readFileSync(
      join(API_ROOT, 'src/modules/runtime-enforcement/runtime-enforcement.module.ts'),
      'utf8',
    );
    expect(enforcementModule).toMatch(/STRATEGY_LIBRARY_LOOKUP_PORT/);
    expect(enforcementModule).toMatch(/STRATEGY_LIBRARY_ELIGIBILITY_PORT/);
    expect(enforcementModule).toMatch(/RUNTIME_ENFORCEMENT_PORT/);

    const orchestratorModule = readFileSync(
      join(API_ROOT, 'src/modules/trading-orchestrator/trading-orchestrator.module.ts'),
      'utf8',
    );
    expect(orchestratorModule).toMatch(/RuntimeEnforcementModule/);
    expect(orchestratorModule).toMatch(/StrategyLibraryModule/);

    const reportingModule = readFileSync(
      join(API_ROOT, 'src/modules/reporting/reporting.module.ts'),
      'utf8',
    );
    expect(reportingModule).toMatch(/KnowledgeLakeModule/);
    expect(reportingModule).toMatch(/KNOWLEDGE_LAKE_QUERY_PORT/);

    const aiModule = readFileSync(
      join(API_ROOT, 'src/modules/ai-analytics/ai-analytics.module.ts'),
      'utf8',
    );
    expect(aiModule).toMatch(/ReportingModule/);
    expect(aiModule).toMatch(/REPORTING_QUERY_PORT/);
  });

  it('keeps Bot Facade as a Session alias, not a second lifecycle SoT', () => {
    const facade = readFileSync(
      join(API_ROOT, 'src/modules/bot-facade/bot-facade.service.ts'),
      'utf8',
    );
    expect(facade).toMatch(/TradingSessionService/);
    expect(facade).toMatch(/Bot id === Trading Session id/);
    expect(facade).not.toMatch(/RUNTIME_ENFORCEMENT_PORT/);
    expect(facade).not.toMatch(/approveRisk/);
    expect(facade).not.toMatch(/submitOrder/);
  });
});
