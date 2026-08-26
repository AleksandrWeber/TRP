/**
 * RC-26 Epic 6 — Market State + Orchestrator authority conformance.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MARKET_STATE_BOUNDARY,
  MARKET_STATE_FORBIDDEN_CAPABILITIES,
  MARKET_STATE_NON_OWNED,
  marketStateForcesTrade,
  marketStateIsExecutionSourceOfTruth,
  marketStateIsProfile,
  marketStateIsQualification,
  marketStateSelectsStrategies,
} from '../domain/market-state-boundary';
import { MARKET_STATE_CONSUMER_INTENDED } from '../domain/market-state-consumer-read-model';
import { MARKET_STATE_PORTS_ACTIVE } from '../ports/market-state.port';
import {
  TRADING_ORCHESTRATOR_BOUNDARY,
  TRADING_ORCHESTRATOR_FORBIDDEN_CAPABILITIES,
  TRADING_ORCHESTRATOR_NON_OWNED,
  tradingOrchestratorApprovesRisk,
  tradingOrchestratorIsExecutionEngine,
  tradingOrchestratorOwnsMarketState,
  tradingOrchestratorOwnsSessionLifecycle,
  tradingOrchestratorReplacesRuntimeEnforcement,
  tradingOrchestratorReplacesStrategyLibrary,
  tradingOrchestratorSubmitsOrders,
} from '../../trading-orchestrator/domain/trading-orchestrator-boundary';
import { TRADING_ORCHESTRATOR_CONSUMER_INTENDED } from '../../trading-orchestrator/domain/trading-orchestrator-consumer-read-model';
import { TRADING_ORCHESTRATOR_PORTS_ACTIVE } from '../../trading-orchestrator/ports/trading-orchestrator.port';

const STATE_ROOT = join(process.cwd(), 'src/modules/market-state');
const ORCH_ROOT = join(process.cwd(), 'src/modules/trading-orchestrator');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
const AI_ROOT = join(process.cwd(), 'src/modules/ai-analytics');
const SESSION_ROOT = join(process.cwd(), 'src/modules/trading-session');
const LIBRARY_ROOT = join(process.cwd(), 'src/modules/strategy-library');
const GATE_ROOT = join(process.cwd(), 'src/modules/runtime-enforcement');
const ORDERS_ROOT = join(process.cwd(), 'src/modules/orders');
const RISK_ROOT = join(process.cwd(), 'src/modules/risk');
const EXEC_ROOT = join(process.cwd(), 'src/modules/execution-engine');

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...listTsFiles(full));
    else if (full.endsWith('.ts') && !full.endsWith('.spec.ts')) out.push(full);
  }
  return out;
}

function importPaths(source: string): string[] {
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!);
}

function moduleImports(root: string, needle: string): boolean {
  try {
    for (const file of listTsFiles(root)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (importPath.replace(/\\/g, '/').includes(needle)) return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

describe('RC-26 Epic 6 — authority conformance', () => {
  it('Market State owns state/lifecycle/version; never Qualification/Profile/Orchestrator', () => {
    expect(MARKET_STATE_BOUNDARY.authorityClass).toBe('market_state_artifact');
    expect(MARKET_STATE_BOUNDARY.ownedConcerns).toEqual(
      expect.arrayContaining([
        'market-state',
        'market-state-lifecycle',
        'market-state-version',
        'market-state-metadata',
      ]),
    );
    expect(marketStateIsQualification()).toBe(false);
    expect(marketStateIsProfile()).toBe(false);
    expect(marketStateSelectsStrategies()).toBe(false);
    expect(marketStateForcesTrade()).toBe(false);
    expect(marketStateIsExecutionSourceOfTruth()).toBe(false);
    expect(MARKET_STATE_NON_OWNED).toEqual(
      expect.arrayContaining([
        'qualification-decisions',
        'market-profile-versions',
        'trading-orchestrator',
        'runtime-enforcement',
        'strategy-library',
        'trading-session',
        'orders',
      ]),
    );
    expect(MARKET_STATE_FORBIDDEN_CAPABILITIES).toEqual(
      expect.arrayContaining(['force-trade', 'select-strategy', 'run-qualification']),
    );
  });

  it('Trading Orchestrator owns workflow/intent; never Library/Gate/State/Session/Orders/Risk', () => {
    expect(TRADING_ORCHESTRATOR_BOUNDARY.authorityClass).toBe('orchestration_artifact');
    expect(TRADING_ORCHESTRATOR_BOUNDARY.ownedConcerns).toEqual(
      expect.arrayContaining([
        'orchestration-workflow',
        'orchestration-intent',
        'orchestration-lifecycle',
        'selection-decision',
        'session-handoff-intent',
      ]),
    );
    expect(tradingOrchestratorReplacesStrategyLibrary()).toBe(false);
    expect(tradingOrchestratorReplacesRuntimeEnforcement()).toBe(false);
    expect(tradingOrchestratorOwnsMarketState()).toBe(false);
    expect(tradingOrchestratorOwnsSessionLifecycle()).toBe(false);
    expect(tradingOrchestratorApprovesRisk()).toBe(false);
    expect(tradingOrchestratorSubmitsOrders()).toBe(false);
    expect(tradingOrchestratorIsExecutionEngine()).toBe(false);
    expect(TRADING_ORCHESTRATOR_NON_OWNED).toEqual(
      expect.arrayContaining([
        'strategy-certification',
        'runtime-enforcement-gate',
        'market-state-ownership',
        'trading-session-lifecycle',
        'orders',
        'risk-decisions',
        'execution-engine',
      ]),
    );
    expect(TRADING_ORCHESTRATOR_FORBIDDEN_CAPABILITIES).toEqual(
      expect.arrayContaining([
        'soft-pass-enforcement-gate',
        'approve-risk',
        'submit-order',
        'become-execution-engine',
      ]),
    );
  });

  it('activates consumer-read ports; Market State REST stays off; Orchestrator REST is product transport', () => {
    expect(MARKET_STATE_PORTS_ACTIVE.consumerRead).toBe(true);
    expect(MARKET_STATE_PORTS_ACTIVE.rest).toBe(false);
    expect(MARKET_STATE_PORTS_ACTIVE.persistence).toBe(true);
    expect(TRADING_ORCHESTRATOR_PORTS_ACTIVE.consumerRead).toBe(true);
    expect(TRADING_ORCHESTRATOR_PORTS_ACTIVE.rest).toBe(true);
    expect(TRADING_ORCHESTRATOR_PORTS_ACTIVE.persistence).toBe(true);
    expect(MARKET_STATE_CONSUMER_INTENDED).toEqual(
      expect.arrayContaining(['reporting', 'ai-analytics', 'command-center']),
    );
    expect(TRADING_ORCHESTRATOR_CONSUMER_INTENDED).toEqual(
      expect.arrayContaining(['reporting', 'ai-analytics', 'command-center']),
    );
  });

  it('forbids reverse deps from Reporting/AI/Session/Library/Gate/Orders/Risk/Execution', () => {
    expect(moduleImports(REPORTING_ROOT, 'market-state')).toBe(false);
    expect(moduleImports(REPORTING_ROOT, 'trading-orchestrator')).toBe(false);
    expect(moduleImports(AI_ROOT, 'market-state')).toBe(false);
    expect(moduleImports(AI_ROOT, 'trading-orchestrator')).toBe(false);
    expect(moduleImports(SESSION_ROOT, 'trading-orchestrator')).toBe(false);
    expect(moduleImports(LIBRARY_ROOT, 'trading-orchestrator')).toBe(false);
    expect(moduleImports(GATE_ROOT, 'trading-orchestrator')).toBe(false);
    expect(moduleImports(ORDERS_ROOT, 'trading-orchestrator')).toBe(false);
    expect(moduleImports(RISK_ROOT, 'trading-orchestrator')).toBe(false);
    expect(moduleImports(EXEC_ROOT, 'trading-orchestrator')).toBe(false);
  });

  it('Market State never imports Orchestrator; Orchestrator never imports Session/Orders/Risk', () => {
    expect(moduleImports(STATE_ROOT, 'trading-orchestrator')).toBe(false);
    expect(moduleImports(ORCH_ROOT, 'trading-session')).toBe(false);
    expect(moduleImports(ORCH_ROOT, '/orders')).toBe(false);
    expect(moduleImports(ORCH_ROOT, '/risk/')).toBe(false);
    expect(moduleImports(ORCH_ROOT, 'execution-engine')).toBe(false);
  });

  it('consumer adapters expose no mutation helpers', async () => {
    const stateAdapter = await import('../adapters/market-state-consumer-read.adapter');
    const orchAdapter =
      await import('../../trading-orchestrator/adapters/trading-orchestrator-consumer-read.adapter');
    expect(stateAdapter).not.toHaveProperty('classifyMarketState');
    expect(stateAdapter).not.toHaveProperty('selectStrategy');
    expect(orchAdapter).not.toHaveProperty('createTradingSession');
    expect(orchAdapter).not.toHaveProperty('approveRisk');
    expect(orchAdapter).not.toHaveProperty('submitOrder');
  });
});
