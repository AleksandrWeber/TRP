import { describe, expect, it } from 'vitest';
import { EXCHANGE_SCOPE_BOUNDARY } from '../modules/exchange-scope/domain/exchange-scope-boundary';
import { KNOWLEDGE_LAKE_BOUNDARY } from '../modules/knowledge-lake/domain/knowledge-lake-boundary';
import { REPORTING_BOUNDARY } from '../modules/reporting/domain/reporting-boundary';
import { RUNTIME_ENFORCEMENT_BOUNDARY } from '../modules/runtime-enforcement/domain/runtime-enforcement-boundary';
import { TRADING_ORCHESTRATOR_BOUNDARY } from '../modules/trading-orchestrator/domain/trading-orchestrator-boundary';
import {
  adjacencyFromAllowedEdges,
  findDirectedCycles,
  isAllowedConsume,
  isForbiddenReverse,
  V2_ALLOWED_CONSUME_EDGES,
  V2_FORBIDDEN_REVERSE_EDGES,
} from './v2-integration-graph';
import { V2_PLATFORM_MODULE_IDS } from './v2-platform-modules';

describe('RC-28 Epic 1 — integration graph', () => {
  it('declares allowed consume edges only among catalogued surfaces', () => {
    for (const edge of V2_ALLOWED_CONSUME_EDGES) {
      expect(V2_PLATFORM_MODULE_IDS).toContain(edge.from);
      expect(V2_PLATFORM_MODULE_IDS).toContain(edge.to);
      expect(edge.from).not.toBe(edge.to);
    }
    expect(isAllowedConsume('runtime-enforcement', 'strategy-library')).toBe(true);
    expect(isAllowedConsume('reporting', 'knowledge-lake')).toBe(true);
    expect(isAllowedConsume('ai-analytics', 'reporting')).toBe(true);
    expect(isAllowedConsume('exchange-scope', 'runtime-enforcement')).toBe(false);
  });

  it('forbids named reverse / steal edges', () => {
    expect(isForbiddenReverse('knowledge-lake', 'reporting')).toBe(true);
    expect(isForbiddenReverse('strategy-library', 'runtime-enforcement')).toBe(true);
    expect(isForbiddenReverse('ai-analytics', 'knowledge-lake')).toBe(true);
    expect(isForbiddenReverse('notification-delivery', 'strategy-library')).toBe(true);
    expect(isForbiddenReverse('exchange-scope', 'trading-orchestrator')).toBe(true);
    expect(isForbiddenReverse('market-state', 'trading-orchestrator')).toBe(true);
    expect(isForbiddenReverse('runtime-enforcement', 'strategy-library')).toBe(false);
    for (const edge of V2_FORBIDDEN_REVERSE_EDGES) {
      expect(isAllowedConsume(edge.from, edge.to)).toBe(false);
    }
  });

  it('has no circular allowed-consume cycles', () => {
    expect(findDirectedCycles(adjacencyFromAllowedEdges())).toEqual([]);
  });

  it('preserves isolation: Scope is isolation-only; Lake/Reporting/Gate/Orchestrator stay in class', () => {
    expect(EXCHANGE_SCOPE_BOUNDARY.isolationRole).toBe('isolation-boundary');
    expect(EXCHANGE_SCOPE_BOUNDARY.isRiskEngine).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.isRuntime).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.executionSourceOfTruth).toBe(false);
    expect(KNOWLEDGE_LAKE_BOUNDARY.authorityClass).toBe('projection');
    expect(REPORTING_BOUNDARY.sourceOfTruth).toBe(false);
    expect(RUNTIME_ENFORCEMENT_BOUNDARY.knowledgeLakeRole).toBe('never-authority');
    expect(TRADING_ORCHESTRATOR_BOUNDARY.authorityClass).toBe('orchestration_artifact');
  });
});
