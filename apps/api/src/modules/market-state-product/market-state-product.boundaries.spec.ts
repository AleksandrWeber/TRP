import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_ROOT = join(process.cwd(), 'src/modules/market-state-product');
const OWNER_ROOT = join(process.cwd(), 'src/modules/market-state');
const QUAL_ROOT = join(process.cwd(), 'src/modules/market-qualification');
const PROFILE_ROOT = join(process.cwd(), 'src/modules/market-profile');
const ORCH_ROOT = join(process.cwd(), 'src/modules/trading-orchestrator');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '/orders',
  '/risk/',
  '/execution-engine',
  '/execution-adapter',
  '/ledger',
  '/positions',
  '/trading-session',
  '/strategy-runtime',
  '/market-qualification',
  '/market-profile',
  '/trading-orchestrator',
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
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]!);
}

function moduleImports(root: string, segment: string): boolean {
  for (const file of listTsFiles(root)) {
    const source = readFileSync(file, 'utf8');
    for (const importPath of importPaths(source)) {
      if (importPath.replace(/\\/g, '/').includes(segment)) return true;
    }
  }
  return false;
}

describe('PC-10 — market-state-product ownership boundaries', () => {
  it('may compose Market State owner reads; never Qual/Profile/Orchestrator/execution', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(PRODUCT_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/market-state-product/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
    expect(moduleImports(PRODUCT_ROOT, 'market-state')).toBe(true);
  });

  it('does not let Market State import the product adapter or activate domain REST', () => {
    expect(moduleImports(OWNER_ROOT, '/market-state-product')).toBe(false);
    const moduleSource = readFileSync(join(OWNER_ROOT, 'market-state.module.ts'), 'utf8');
    expect(moduleSource).not.toMatch(/Controller/);
    expect(moduleSource).not.toMatch(/MARKET_STATE_SERVICE_PORT/);
    expect(moduleSource).not.toMatch(/MARKET_STATE_QUERY_PORT/);
    const ports = readFileSync(join(OWNER_ROOT, 'ports/market-state.port.ts'), 'utf8');
    expect(ports).toMatch(/rest: false/);
    expect(ports).toMatch(/marketStateService: false/);
    expect(ports).toMatch(/marketStateQuery: false/);
  });

  it('does not let Qualification, Profile, or Orchestrator import the product adapter', () => {
    expect(moduleImports(QUAL_ROOT, '/market-state-product')).toBe(false);
    expect(moduleImports(PROFILE_ROOT, '/market-state-product')).toBe(false);
    expect(moduleImports(ORCH_ROOT, '/market-state-product')).toBe(false);
  });

  it('delegates existing queries/refresh only — no classify, select, or orchestrate', () => {
    const service = readFileSync(join(PRODUCT_ROOT, 'market-state-product.service.ts'), 'utf8');
    expect(service).toMatch(/getCurrent/);
    expect(service).toMatch(/listHistory/);
    expect(service).toMatch(/publishNextMarketState/);
    expect(service).not.toMatch(/classifyMarketState/);
    expect(service).not.toMatch(/selectStrategy/);
    expect(service).not.toMatch(/requestOrchestrationRun/);
    expect(service).not.toMatch(/createTradingSession/);
  });
});
