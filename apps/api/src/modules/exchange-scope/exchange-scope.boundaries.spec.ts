import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const EXCHANGE_SCOPE_ROOT = join(process.cwd(), 'src/modules/exchange-scope');
const RUNTIME_ENFORCEMENT_ROOT = join(process.cwd(), 'src/modules/runtime-enforcement');
const STRATEGY_LIBRARY_ROOT = join(process.cwd(), 'src/modules/strategy-library');
const STRATEGY_RUNTIME_ROOT = join(process.cwd(), 'src/modules/strategy-runtime');
const ORDERS_ROOT = join(process.cwd(), 'src/modules/orders');
const RISK_ROOT = join(process.cwd(), 'src/modules/risk');
const EXECUTION_ENGINE_ROOT = join(process.cwd(), 'src/modules/execution-engine');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
const MARKET_STATE_ROOT = join(process.cwd(), 'src/modules/market-state');
const TRADING_ORCHESTRATOR_ROOT = join(process.cwd(), 'src/modules/trading-orchestrator');

/**
 * Epic 1: Exchange Scope must not import trading-path / engine modules.
 * RC-19 identity may be consumed by Session / PaperAccount (reverse OK for identity).
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
  '/notification-delivery',
  '/trading-orchestrator',
  '/market-state',
  '/market-qualification',
  '/market-profile',
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

/**
 * Detect Nest-module / boundary imports of exchange-scope (not RC-19 identity-only
 * barrel usage via `../../exchange-scope` for `resolveExchangeScopeId`).
 */
function moduleImportsExchangeScopeNestSurface(root: string): boolean {
  try {
    for (const file of listTsFiles(root)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        const normalized = importPath.replace(/\\/g, '/');
        if (normalized.includes('exchange-scope-boundary')) return true;
        if (normalized.includes('ExchangeScopeModule')) return true;
        if (normalized.includes('ExchangeScopeBoundaryService')) return true;
        if (normalized.includes('/ports/exchange-scope.port')) return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

describe('RC-27 Epic 1 — Exchange Scope dependency direction', () => {
  it('forbids Runtime / Orders / Execution / Session / Reporting imports', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(EXCHANGE_SCOPE_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/exchange-scope/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('does not create reverse Nest-surface dependencies from engines / peers', () => {
    expect(moduleImportsExchangeScopeNestSurface(RUNTIME_ENFORCEMENT_ROOT)).toBe(false);
    expect(moduleImportsExchangeScopeNestSurface(STRATEGY_LIBRARY_ROOT)).toBe(false);
    expect(moduleImportsExchangeScopeNestSurface(STRATEGY_RUNTIME_ROOT)).toBe(false);
    expect(moduleImportsExchangeScopeNestSurface(ORDERS_ROOT)).toBe(false);
    expect(moduleImportsExchangeScopeNestSurface(RISK_ROOT)).toBe(false);
    expect(moduleImportsExchangeScopeNestSurface(EXECUTION_ENGINE_ROOT)).toBe(false);
    expect(moduleImportsExchangeScopeNestSurface(REPORTING_ROOT)).toBe(false);
    expect(moduleImportsExchangeScopeNestSurface(MARKET_STATE_ROOT)).toBe(false);
    expect(moduleImportsExchangeScopeNestSurface(TRADING_ORCHESTRATOR_ROOT)).toBe(false);
  });

  it('module composition wires service / query / consumer ports without trading-path modules', () => {
    const moduleSource = readFileSync(
      join(EXCHANGE_SCOPE_ROOT, 'exchange-scope.module.ts'),
      'utf8',
    );
    expect(moduleSource).toMatch(/ExchangeScopeBoundaryService/);
    expect(moduleSource).toMatch(/InMemoryExchangeScopeStore/);
    expect(moduleSource).toMatch(/ExchangeScopeLifecycleService/);
    expect(moduleSource).toMatch(/ExchangeScopeQueryService/);
    expect(moduleSource).toMatch(/ExchangeScopeConsumerReadAdapter/);
    expect(moduleSource).toMatch(/ExchangeScopeConsumerReadService/);
    expect(moduleSource).toMatch(/EXCHANGE_SCOPE_SERVICE_PORT/);
    expect(moduleSource).toMatch(/EXCHANGE_SCOPE_QUERY_PORT/);
    expect(moduleSource).toMatch(/EXCHANGE_SCOPE_CONSUMER_READ_PORT/);
    expect(moduleSource).not.toMatch(/RuntimeEnforcementModule/);
    expect(moduleSource).not.toMatch(/StrategyLibraryModule/);
    expect(moduleSource).not.toMatch(/TradingSessionModule/);
    expect(moduleSource).not.toMatch(/TradingOrchestratorModule/);
    expect(moduleSource).not.toMatch(/MarketStateModule/);
    expect(moduleSource).not.toMatch(/OrdersModule/);
    expect(moduleSource).not.toMatch(/RiskModule/);
    expect(moduleSource).not.toMatch(/ExecutionEngineModule/);
    expect(moduleSource).not.toMatch(/ReportingModule/);
    expect(moduleSource).not.toMatch(/LiveMarketDataModule/);
    expect(moduleSource).not.toMatch(/Controller/);
    expect(moduleSource).not.toMatch(/Prisma/);
  });
});
