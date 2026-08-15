import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const QUAL_ROOT = join(process.cwd(), 'src/modules/market-qualification');
const LIVE_MARKET_DATA_ROOT = join(process.cwd(), 'src/modules/live-market-data');
const RUNTIME_ENFORCEMENT_ROOT = join(process.cwd(), 'src/modules/runtime-enforcement');
const STRATEGY_LIBRARY_ROOT = join(process.cwd(), 'src/modules/strategy-library');
const TRADING_SESSION_ROOT = join(process.cwd(), 'src/modules/trading-session');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');

/** Qualification may import LMD + Lake; must not depend on Runtime path / Reporting. */
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
  '/market-profile',
  '/product-flow',
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

function moduleImportsQualification(root: string): boolean {
  try {
    for (const file of listTsFiles(root)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        const normalized = importPath.replace(/\\/g, '/');
        if (
          normalized.includes('market-qualification') ||
          normalized.includes('/modules/market-qualification')
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

describe('RC-25 Epic 4 — Market Qualification dependency direction', () => {
  it('forbids Runtime / Library / Session / Orders / Execution / Reporting / Profile imports', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(QUAL_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/market-qualification/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('does not create reverse dependencies from Live Market Data / Enforcement / Library / Session / Reporting', () => {
    expect(moduleImportsQualification(LIVE_MARKET_DATA_ROOT)).toBe(false);
    expect(moduleImportsQualification(RUNTIME_ENFORCEMENT_ROOT)).toBe(false);
    expect(moduleImportsQualification(STRATEGY_LIBRARY_ROOT)).toBe(false);
    expect(moduleImportsQualification(TRADING_SESSION_ROOT)).toBe(false);
    expect(moduleImportsQualification(REPORTING_ROOT)).toBe(false);
  });

  it('module composition wires lifecycle + query ports without Runtime / Session / REST', () => {
    const moduleSource = readFileSync(join(QUAL_ROOT, 'market-qualification.module.ts'), 'utf8');
    expect(moduleSource).toMatch(/MarketQualificationBoundaryService/);
    expect(moduleSource).toMatch(/MarketQualificationLifecycleService/);
    expect(moduleSource).toMatch(/MarketQualificationQueryService/);
    expect(moduleSource).toMatch(/InMemoryQualificationStore/);
    expect(moduleSource).toMatch(/LiveMarketDataModule/);
    expect(moduleSource).toMatch(/KnowledgeLakeModule/);
    expect(moduleSource).toMatch(/LIVE_MARKET_DATA_READ_CONSUMER/);
    expect(moduleSource).toMatch(/RESEARCH_OUTPUT_READ_CONSUMER/);
    expect(moduleSource).toMatch(/MARKET_QUALIFICATION_SERVICE_PORT/);
    expect(moduleSource).toMatch(/MARKET_QUALIFICATION_QUERY_PORT/);
    expect(moduleSource).toMatch(/MARKET_QUALIFICATION_CONSUMER_READ_PORT/);
    expect(moduleSource).toMatch(/MarketQualificationConsumerReadAdapter/);
    expect(moduleSource).not.toMatch(/RuntimeEnforcementModule/);
    expect(moduleSource).not.toMatch(/StrategyLibraryModule/);
    expect(moduleSource).not.toMatch(/TradingSessionModule/);
    expect(moduleSource).not.toMatch(/OrdersModule/);
    expect(moduleSource).not.toMatch(/ExecutionEngineModule/);
    expect(moduleSource).not.toMatch(/ReportingModule/);
    expect(moduleSource).not.toMatch(/Controller/);
  });
});
