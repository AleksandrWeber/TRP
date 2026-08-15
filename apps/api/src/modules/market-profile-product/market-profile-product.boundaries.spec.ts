import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_ROOT = join(process.cwd(), 'src/modules/market-profile-product');
const OWNER_ROOT = join(process.cwd(), 'src/modules/market-profile');
const QUAL_ROOT = join(process.cwd(), 'src/modules/market-qualification');
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
  '/market-qualification',
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

describe('PC-09 — market-profile-product ownership boundaries', () => {
  it('may compose Profile query ports; never Qualification/State/execution', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(PRODUCT_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/market-profile-product/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
    expect(moduleImports(PRODUCT_ROOT, 'market-profile')).toBe(true);
  });

  it('does not let Profile import the product adapter or activate domain REST', () => {
    expect(moduleImports(OWNER_ROOT, '/market-profile-product')).toBe(false);
    const moduleSource = readFileSync(join(OWNER_ROOT, 'market-profile.module.ts'), 'utf8');
    expect(moduleSource).not.toMatch(/Controller/);
    const ports = readFileSync(join(OWNER_ROOT, 'ports/market-profile.port.ts'), 'utf8');
    expect(ports).toMatch(/rest: false/);
  });

  it('does not let Qualification or Market State import the product adapter', () => {
    expect(moduleImports(QUAL_ROOT, '/market-profile-product')).toBe(false);
    expect(moduleImports(STATE_ROOT, '/market-profile-product')).toBe(false);
  });

  it('delegates existing queries only — no publish, scoring, or classification', () => {
    const service = readFileSync(join(PRODUCT_ROOT, 'market-profile-product.service.ts'), 'utf8');
    expect(service).toMatch(/getLatestProfile/);
    expect(service).toMatch(/getProfileByVersion/);
    expect(service).toMatch(/listProfileVersions/);
    expect(service).toMatch(/listWorkspaceProfiles/);
    expect(service).not.toMatch(/publishProfileVersion/);
    expect(service).not.toMatch(/scoreConfidence/);
    expect(service).not.toMatch(/classifyMarket/);
    expect(service).not.toMatch(/createTradingSession/);
  });
});
