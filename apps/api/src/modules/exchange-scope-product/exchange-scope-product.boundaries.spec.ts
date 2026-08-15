import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_ROOT = join(process.cwd(), 'src/modules/exchange-scope-product');
const OWNER_ROOT = join(process.cwd(), 'src/modules/exchange-scope');
const RUNTIME_ROOT = join(process.cwd(), 'src/modules/strategy-runtime');
const SESSION_ROOT = join(process.cwd(), 'src/modules/trading-session');
const DEPLOY_ROOT = join(process.cwd(), 'src/modules/strategy-deployment');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '/orders',
  '/risk/',
  '/execution-engine',
  '/execution-adapter',
  '/ledger',
  '/positions',
  '/trading-session',
  '/strategy-runtime',
  '/strategy-deployment',
  '/live-trading',
  '/exchange-adapter',
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

describe('PC-12 — exchange-scope-product ownership boundaries', () => {
  it('may compose Exchange Scope ports; never Runtime/Session/Deployment/venue adapters', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(PRODUCT_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/exchange-scope-product/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
    expect(moduleImports(PRODUCT_ROOT, 'exchange-scope')).toBe(true);
  });

  it('does not let Exchange Scope import the product adapter', () => {
    expect(moduleImports(OWNER_ROOT, '/exchange-scope-product')).toBe(false);
    const moduleSource = readFileSync(join(OWNER_ROOT, 'exchange-scope.module.ts'), 'utf8');
    expect(moduleSource).not.toMatch(/Controller/);
    const ports = readFileSync(join(OWNER_ROOT, 'ports/exchange-scope.port.ts'), 'utf8');
    expect(ports).toMatch(/rest: false/);
  });

  it('does not let Runtime, Session, or Deployment import the product adapter', () => {
    expect(moduleImports(RUNTIME_ROOT, '/exchange-scope-product')).toBe(false);
    expect(moduleImports(SESSION_ROOT, '/exchange-scope-product')).toBe(false);
    expect(moduleImports(DEPLOY_ROOT, '/exchange-scope-product')).toBe(false);
  });

  it('delegates existing commands only — no venue API or exchange client', () => {
    const service = readFileSync(join(PRODUCT_ROOT, 'exchange-scope-product.service.ts'), 'utf8');
    expect(service).toMatch(/registerExchangeScope/);
    expect(service).toMatch(/activateExchangeScope/);
    expect(service).toMatch(/updateExchangeScopeConfig/);
    expect(service).not.toMatch(/fetch\(/);
    expect(service).not.toMatch(/binance/i);
    expect(service).not.toMatch(/apiKey/);
    expect(service).not.toMatch(/createTradingSession/);
    expect(service).not.toMatch(/approveRisk/);
  });
});
