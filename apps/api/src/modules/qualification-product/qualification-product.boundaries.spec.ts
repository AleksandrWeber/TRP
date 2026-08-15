import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_ROOT = join(process.cwd(), 'src/modules/qualification-product');
const OWNER_ROOT = join(process.cwd(), 'src/modules/market-qualification');
const PROFILE_ROOT = join(process.cwd(), 'src/modules/market-profile');
const STATE_ROOT = join(process.cwd(), 'src/modules/market-state');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '/orders',
  '/risk/',
  '/execution-engine',
  '/execution-adapter',
  '/ledger',
  '/positions',
  '/trading-session',
  '/strategy-runtime',
  '/market-profile',
  '/market-state',
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

describe('PC-08 — qualification-product ownership boundaries', () => {
  it('may compose Qualification ports; never Profile/State/execution', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(PRODUCT_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/qualification-product/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
    expect(moduleImports(PRODUCT_ROOT, 'market-qualification')).toBe(true);
  });

  it('does not let Qualification import the product adapter', () => {
    expect(moduleImports(OWNER_ROOT, '/qualification-product')).toBe(false);
    const moduleSource = readFileSync(join(OWNER_ROOT, 'market-qualification.module.ts'), 'utf8');
    expect(moduleSource).not.toMatch(/Controller/);
    const ports = readFileSync(join(OWNER_ROOT, 'ports/market-qualification.port.ts'), 'utf8');
    expect(ports).toMatch(/rest: false/);
  });

  it('does not let Profile or Market State import the product adapter', () => {
    expect(moduleImports(PROFILE_ROOT, '/qualification-product')).toBe(false);
    expect(moduleImports(STATE_ROOT, '/qualification-product')).toBe(false);
  });

  it('delegates existing commands only — no scoring or profile publish', () => {
    const service = readFileSync(join(PRODUCT_ROOT, 'qualification-product.service.ts'), 'utf8');
    expect(service).toMatch(/requestQualificationRun/);
    expect(service).toMatch(/confirmQualificationRun/);
    expect(service).toMatch(/listQualificationTargets/);
    expect(service).not.toMatch(/scoreConfidence/);
    expect(service).not.toMatch(/publishProfileVersion/);
    expect(service).not.toMatch(/classifyMarket/);
    expect(service).not.toMatch(/createTradingSession/);
  });
});
