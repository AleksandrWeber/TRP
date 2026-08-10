import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const MARKET_STATE_ROOT = join(process.cwd(), 'src/modules/market-state');
const RUNTIME_ENFORCEMENT_ROOT = join(process.cwd(), 'src/modules/runtime-enforcement');
const STRATEGY_LIBRARY_ROOT = join(process.cwd(), 'src/modules/strategy-library');
const TRADING_SESSION_ROOT = join(process.cwd(), 'src/modules/trading-session');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
const LIVE_MARKET_DATA_ROOT = join(process.cwd(), 'src/modules/live-market-data');
const MARKET_QUALIFICATION_ROOT = join(process.cwd(), 'src/modules/market-qualification');
const MARKET_PROFILE_ROOT = join(process.cwd(), 'src/modules/market-profile');
const ORDERS_ROOT = join(process.cwd(), 'src/modules/orders');
const RISK_ROOT = join(process.cwd(), 'src/modules/risk');
const TRADING_ORCHESTRATOR_ROOT = join(process.cwd(), 'src/modules/trading-orchestrator');

/**
 * Epic 2: Market State may import LMD / Qualification / Profile.
 * Must not import Runtime path / Orchestrator / Reporting.
 */
const FORBIDDEN_IMPORT_SEGMENTS = [
  '/orders',
  '/risk',
  '/risk-engine',
  '/execution-engine',
  '/execution-adapter',
  '/ledger',
  '/positions',
  '/trading-session',
  '/strategy-deployment',
  '/strategy-runtime',
  '/runtime-enforcement',
  '/strategy-library',
  '/bot-facade',
  '/paper-trading',
  '/reporting',
  '/ai-analytics',
  '/knowledge-lake',
  '/trading-orchestrator',
] as const;

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
  const matches = source.matchAll(/from\s+['"]([^'"]+)['"]/g);
  return [...matches].map((match) => match[1]!);
}

function moduleImportsMarketState(root: string): boolean {
  try {
    for (const file of listTsFiles(root)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        const normalized = importPath.replace(/\\/g, '/');
        // Match Nest module `market-state` only — not LMD `latest-market-state`.
        if (normalized.includes('/modules/market-state')) return true;
        if (/(^|\/)\.\.\/(?:\.\.\/)*market-state(?:\/|$)/.test(normalized)) return true;
        if (normalized === 'market-state' || normalized.startsWith('market-state/')) return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

describe('RC-26 Epic 2 — Market State dependency direction', () => {
  it('forbids Runtime / Library / Session / Orders / Orchestrator / Reporting imports', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(MARKET_STATE_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/market-state/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('does not create reverse dependencies from upstream peers or execution path', () => {
    expect(moduleImportsMarketState(RUNTIME_ENFORCEMENT_ROOT)).toBe(false);
    expect(moduleImportsMarketState(STRATEGY_LIBRARY_ROOT)).toBe(false);
    expect(moduleImportsMarketState(TRADING_SESSION_ROOT)).toBe(false);
    expect(moduleImportsMarketState(REPORTING_ROOT)).toBe(false);
    expect(moduleImportsMarketState(LIVE_MARKET_DATA_ROOT)).toBe(false);
    expect(moduleImportsMarketState(MARKET_QUALIFICATION_ROOT)).toBe(false);
    expect(moduleImportsMarketState(MARKET_PROFILE_ROOT)).toBe(false);
    expect(moduleImportsMarketState(ORDERS_ROOT)).toBe(false);
    expect(moduleImportsMarketState(RISK_ROOT)).toBe(false);
    expect(moduleImportsMarketState(TRADING_ORCHESTRATOR_ROOT)).toBe(false);
  });

  it('module composition wires LMD / Qual / Profile consumers; no classify ports or Runtime path', () => {
    const moduleSource = readFileSync(join(MARKET_STATE_ROOT, 'market-state.module.ts'), 'utf8');
    expect(moduleSource).toMatch(/MarketStateBoundaryService/);
    expect(moduleSource).toMatch(/LiveMarketDataModule/);
    expect(moduleSource).toMatch(/MarketQualificationModule/);
    expect(moduleSource).toMatch(/MarketProfileModule/);
    expect(moduleSource).toMatch(/MarketStateObservationalReadService/);
    expect(moduleSource).toMatch(/MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER/);
    expect(moduleSource).toMatch(/MARKET_STATE_QUALIFICATION_CONSUMER/);
    expect(moduleSource).toMatch(/MARKET_STATE_PROFILE_CONSUMER/);
    expect(moduleSource).not.toMatch(/MARKET_STATE_SERVICE_PORT/);
    expect(moduleSource).not.toMatch(/MARKET_STATE_QUERY_PORT/);
    expect(moduleSource).not.toMatch(/RuntimeEnforcementModule/);
    expect(moduleSource).not.toMatch(/StrategyLibraryModule/);
    expect(moduleSource).not.toMatch(/TradingSessionModule/);
    expect(moduleSource).not.toMatch(/TradingOrchestratorModule/);
    expect(moduleSource).not.toMatch(/OrdersModule/);
    expect(moduleSource).not.toMatch(/RiskModule/);
    expect(moduleSource).not.toMatch(/ExecutionEngineModule/);
    expect(moduleSource).not.toMatch(/ReportingModule/);
    expect(moduleSource).not.toMatch(/Controller/);
  });
});
