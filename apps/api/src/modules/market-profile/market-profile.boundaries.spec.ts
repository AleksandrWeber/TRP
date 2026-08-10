import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PROFILE_ROOT = join(process.cwd(), 'src/modules/market-profile');
const RUNTIME_ENFORCEMENT_ROOT = join(process.cwd(), 'src/modules/runtime-enforcement');
const STRATEGY_LIBRARY_ROOT = join(process.cwd(), 'src/modules/strategy-library');
const TRADING_SESSION_ROOT = join(process.cwd(), 'src/modules/trading-session');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
const LIVE_MARKET_DATA_ROOT = join(process.cwd(), 'src/modules/live-market-data');

/**
 * Profile may import Qualification; must not import LMD directly or Runtime path.
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
  '/live-market-data',
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

function moduleImportsProfile(root: string): boolean {
  try {
    for (const file of listTsFiles(root)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        const normalized = importPath.replace(/\\/g, '/');
        if (
          normalized.includes('market-profile') ||
          normalized.includes('/modules/market-profile')
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

describe('RC-25 Epic 5 — Market Profile dependency direction', () => {
  it('forbids Runtime / Library / Session / Orders / LMD-direct / Reporting imports', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(PROFILE_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/market-profile/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('does not create reverse dependencies from Enforcement / Library / Session / Reporting / LMD', () => {
    expect(moduleImportsProfile(RUNTIME_ENFORCEMENT_ROOT)).toBe(false);
    expect(moduleImportsProfile(STRATEGY_LIBRARY_ROOT)).toBe(false);
    expect(moduleImportsProfile(TRADING_SESSION_ROOT)).toBe(false);
    expect(moduleImportsProfile(REPORTING_ROOT)).toBe(false);
    expect(moduleImportsProfile(LIVE_MARKET_DATA_ROOT)).toBe(false);
  });

  it('module composition wires versioning ports via Qualification only', () => {
    const moduleSource = readFileSync(join(PROFILE_ROOT, 'market-profile.module.ts'), 'utf8');
    expect(moduleSource).toMatch(/MarketProfileBoundaryService/);
    expect(moduleSource).toMatch(/MarketQualificationModule/);
    expect(moduleSource).toMatch(/MarketProfileObservationalReadService/);
    expect(moduleSource).toMatch(/MarketProfileVersioningService/);
    expect(moduleSource).toMatch(/MarketProfileQueryService/);
    expect(moduleSource).toMatch(/InMemoryMarketProfileStore/);
    expect(moduleSource).toMatch(/MARKET_PROFILE_SERVICE_PORT/);
    expect(moduleSource).toMatch(/MARKET_PROFILE_QUERY_PORT/);
    expect(moduleSource).toMatch(/MARKET_PROFILE_CONSUMER_READ_PORT/);
    expect(moduleSource).toMatch(/MarketProfileConsumerReadAdapter/);
    expect(moduleSource).not.toMatch(/LiveMarketDataModule/);
    expect(moduleSource).not.toMatch(/KnowledgeLakeModule/);
    expect(moduleSource).not.toMatch(/RuntimeEnforcementModule/);
    expect(moduleSource).not.toMatch(/StrategyLibraryModule/);
    expect(moduleSource).not.toMatch(/TradingSessionModule/);
    expect(moduleSource).not.toMatch(/ReportingModule/);
    expect(moduleSource).not.toMatch(/Controller/);
  });
});
