import { describe, expect, it } from 'vitest';
import { AI_ANALYTICS_BOUNDARY } from '../modules/ai-analytics/domain/ai-analytics-boundary';
import { EXCHANGE_SCOPE_BOUNDARY } from '../modules/exchange-scope/domain/exchange-scope-boundary';
import { KNOWLEDGE_LAKE_BOUNDARY } from '../modules/knowledge-lake/domain/knowledge-lake-boundary';
import { KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER } from '../modules/knowledge-lake/projections/research-lab-producer-registry';
import { KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS } from '../modules/knowledge-lake/projections/trading-path-producer-registry';
import { NOTIFICATION_DELIVERY_BOUNDARY } from '../modules/notification-delivery/domain/notification-boundary';
import { REPORTING_BOUNDARY } from '../modules/reporting/domain/reporting-boundary';
import { RUNTIME_ENFORCEMENT_BOUNDARY } from '../modules/runtime-enforcement/domain/runtime-enforcement-boundary';
import { STRATEGY_LIBRARY_BOUNDARY } from '../modules/strategy-library/domain/strategy-library-boundary';
import { TRADING_ORCHESTRATOR_BOUNDARY } from '../modules/trading-orchestrator/domain/trading-orchestrator-boundary';
import { V2_EXTERNAL_SOLE_OWNERS, ownerOf } from './v2-ownership-graph';
import { V2_WORKFLOW_HOPS } from './v2-workflow-graph';

describe('RC-28 Epic 2 — ownership continuity', () => {
  it('leaves every hop with ownershipTransfer = false', () => {
    expect(V2_WORKFLOW_HOPS.every((hop) => hop.ownershipTransfer === false)).toBe(true);
  });

  it('keeps Library as certification SoT and Enforcement as Gate only', () => {
    expect(STRATEGY_LIBRARY_BOUNDARY.authorityClass).toBe('source_of_truth');
    expect(RUNTIME_ENFORCEMENT_BOUNDARY.authorityClass).toBe('gate');
    expect(RUNTIME_ENFORCEMENT_BOUNDARY.strategyLibraryRole).toBe('read-only-consumer');
    expect(ownerOf('certified-strategy-lifecycle')).toBe('strategy-library');
    expect(ownerOf('enforcement-pass-fail')).toBe('runtime-enforcement');
  });

  it('keeps Orchestrator as coordination; Session / Orders / Risk / Execution remain Freeze owners', () => {
    expect(TRADING_ORCHESTRATOR_BOUNDARY.authorityClass).toBe('orchestration_artifact');
    expect(TRADING_ORCHESTRATOR_BOUNDARY.nonOwned).toEqual(
      expect.arrayContaining([
        'trading-session-lifecycle',
        'orders',
        'risk-decisions',
        'execution-engine',
      ]),
    );
    expect(V2_EXTERNAL_SOLE_OWNERS['trading-session-lifecycle']).toBe('trading-session');
    expect(V2_EXTERNAL_SOLE_OWNERS.orders).toBe('orders');
    expect(V2_EXTERNAL_SOLE_OWNERS.execution).toBe('execution-engine');
    expect(V2_EXTERNAL_SOLE_OWNERS.ledger).toBe('accounting');
    expect(V2_EXTERNAL_SOLE_OWNERS['risk-decisions']).toBe('risk-engine');
  });

  it('keeps Lake / Reporting / AI / Notification from becoming money or lifecycle SoT', () => {
    expect(KNOWLEDGE_LAKE_BOUNDARY.authorityClass).toBe('projection');
    expect(KNOWLEDGE_LAKE_BOUNDARY.writeSemantics).toBe('append-only');
    expect(REPORTING_BOUNDARY.sourceOfTruth).toBe(false);
    expect(AI_ANALYTICS_BOUNDARY.sourceOfTruth).toBe(false);
    expect(NOTIFICATION_DELIVERY_BOUNDARY.sourceOfTruth).toBe(false);
    expect(KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER.feedbackToSoT).toBe(false);
    expect(
      KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS.every((producer) => producer.feedbackToSoT === false),
    ).toBe(true);
  });

  it('keeps Exchange Scope isolation-only across the workflow', () => {
    expect(EXCHANGE_SCOPE_BOUNDARY.isolationRole).toBe('isolation-boundary');
    expect(EXCHANGE_SCOPE_BOUNDARY.approvesRisk).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.submitsOrders).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.isRuntime).toBe(false);
  });
});
