import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ORCHESTRATOR_ROOT = join(process.cwd(), 'src/modules/trading-orchestrator');
const RUNTIME_ENFORCEMENT_ROOT = join(process.cwd(), 'src/modules/runtime-enforcement');
const STRATEGY_LIBRARY_ROOT = join(process.cwd(), 'src/modules/strategy-library');
const TRADING_SESSION_ROOT = join(process.cwd(), 'src/modules/trading-session');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
const LIVE_MARKET_DATA_ROOT = join(process.cwd(), 'src/modules/live-market-data');
const MARKET_QUALIFICATION_ROOT = join(process.cwd(), 'src/modules/market-qualification');
const MARKET_PROFILE_ROOT = join(process.cwd(), 'src/modules/market-profile');
const MARKET_STATE_ROOT = join(process.cwd(), 'src/modules/market-state');
const ORDERS_ROOT = join(process.cwd(), 'src/modules/orders');
const RISK_ROOT = join(process.cwd(), 'src/modules/risk');
const EXECUTION_ENGINE_ROOT = join(process.cwd(), 'src/modules/execution-engine');

/**
 * Epic 5: Orchestrator may consume Library + Gate.
 * Still forbids Session ownership, Orders, Risk module, Execution, etc.
 */
const FORBIDDEN_IMPORT_SEGMENTS = [
  '/orders',
  '/risk/',
  '/risk-engine',
  '/execution-engine',
  '/execution-adapter',
  '/ledger',
  '/positions',
  '/trading-session',
  '/strategy-deployment',
  '/strategy-runtime',
  '/bot-facade',
  '/paper-trading',
  '/reporting',
  '/ai-analytics',
  '/knowledge-lake',
  '/live-market-data',
  '/market-data/',
  '/market-qualification',
  '/market-profile',
] as const;

/** Allowed one-way consumers (Epic 5). */
const ALLOWED_UPSTREAM_SEGMENTS = ['/strategy-library', '/runtime-enforcement'] as const;

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

function moduleImportsOrchestrator(root: string): boolean {
  try {
    for (const file of listTsFiles(root)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        const normalized = importPath.replace(/\\/g, '/');
        if (
          normalized.includes('trading-orchestrator') ||
          normalized.includes('/modules/trading-orchestrator')
        ) {
          return true;
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}

describe('RC-26 Epic 5 — Trading Orchestrator dependency direction', () => {
  it('forbids Session / Orders / Risk / Execution imports; allows Library + Gate', () => {
    const violations: string[] = [];
    const allowedHits: string[] = [];
    for (const file of listTsFiles(ORCHESTRATOR_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const allowed of ALLOWED_UPSTREAM_SEGMENTS) {
          if (normalized.includes(allowed)) {
            allowedHits.push(`${file.split('/trading-orchestrator/')[1]} → ${importPath}`);
          }
        }
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/trading-orchestrator/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
    expect(allowedHits.length).toBeGreaterThan(0);
  });

  it('does not create reverse dependencies from peers or execution path modules', () => {
    expect(moduleImportsOrchestrator(RUNTIME_ENFORCEMENT_ROOT)).toBe(false);
    expect(moduleImportsOrchestrator(STRATEGY_LIBRARY_ROOT)).toBe(false);
    expect(moduleImportsOrchestrator(TRADING_SESSION_ROOT)).toBe(false);
    expect(moduleImportsOrchestrator(REPORTING_ROOT)).toBe(false);
    expect(moduleImportsOrchestrator(LIVE_MARKET_DATA_ROOT)).toBe(false);
    expect(moduleImportsOrchestrator(MARKET_QUALIFICATION_ROOT)).toBe(false);
    expect(moduleImportsOrchestrator(MARKET_PROFILE_ROOT)).toBe(false);
    expect(moduleImportsOrchestrator(MARKET_STATE_ROOT)).toBe(false);
    expect(moduleImportsOrchestrator(ORDERS_ROOT)).toBe(false);
    expect(moduleImportsOrchestrator(RISK_ROOT)).toBe(false);
    expect(moduleImportsOrchestrator(EXECUTION_ENGINE_ROOT)).toBe(false);
  });

  it('module composition wires Service/Query + Library/Gate; no Session/Orders/Risk on the owner module', () => {
    const moduleSource = readFileSync(
      join(ORCHESTRATOR_ROOT, 'trading-orchestrator.module.ts'),
      'utf8',
    );
    expect(moduleSource).toMatch(/TradingOrchestratorBoundaryService/);
    expect(moduleSource).toMatch(/TRADING_ORCHESTRATOR_SERVICE_PORT/);
    expect(moduleSource).toMatch(/TRADING_ORCHESTRATOR_QUERY_PORT/);
    expect(moduleSource).toMatch(/StrategyLibraryModule/);
    expect(moduleSource).toMatch(/RuntimeEnforcementModule/);
    expect(moduleSource).not.toMatch(/TradingSessionModule/);
    expect(moduleSource).not.toMatch(/OrdersModule/);
    expect(moduleSource).not.toMatch(/RiskModule/);
    expect(moduleSource).not.toMatch(/ExecutionEngineModule/);
    expect(moduleSource).not.toMatch(/ReportingModule/);
    expect(moduleSource).not.toMatch(/Controller/);
  });
});
