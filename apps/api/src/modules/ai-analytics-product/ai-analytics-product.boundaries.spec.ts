import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_ROOT = join(process.cwd(), 'src/modules/ai-analytics-product');
const AI_ROOT = join(process.cwd(), 'src/modules/ai-analytics');
const LAKE_ROOT = join(process.cwd(), 'src/modules/knowledge-lake');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
const NOTIFICATION_ROOT = join(process.cwd(), 'src/modules/notification-delivery');
const GATEWAY_ROOT = join(process.cwd(), 'src/modules/ai');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '/orders',
  '/risk/',
  '/execution-engine',
  '/execution-adapter',
  '/ledger',
  '/positions',
  '/notification-delivery',
  '/product-flow',
  '/modules/ai/',
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

describe('PC-17 — ai-analytics-product ownership boundaries', () => {
  it('may compose AI generation, Reporting reads, Lake queries, and Library lookup; never Orders/Risk/Notify/Gateway', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(PRODUCT_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/ai-analytics-product/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
    expect(moduleImports(PRODUCT_ROOT, '/ai-analytics')).toBe(true);
    expect(moduleImports(PRODUCT_ROOT, '/reporting')).toBe(true);
    expect(moduleImports(PRODUCT_ROOT, '/knowledge-lake')).toBe(true);
    expect(moduleImports(PRODUCT_ROOT, '/strategy-library')).toBe(true);
  });

  it('does not let AI, Lake, Reporting, Notification, or the AI gateway import the product adapter', () => {
    expect(moduleImports(AI_ROOT, '/ai-analytics-product')).toBe(false);
    expect(moduleImports(LAKE_ROOT, '/ai-analytics-product')).toBe(false);
    expect(moduleImports(REPORTING_ROOT, '/ai-analytics-product')).toBe(false);
    expect(moduleImports(NOTIFICATION_ROOT, '/ai-analytics-product')).toBe(false);
    expect(moduleImports(GATEWAY_ROOT, '/ai-analytics-product')).toBe(false);
    expect(moduleImports(AI_ROOT, '/knowledge-lake')).toBe(false);
  });

  it('exposes generation over existing ports — no report, lake, notify, or order writes', () => {
    const service = readFileSync(join(PRODUCT_ROOT, 'ai-analytics-product.service.ts'), 'utf8');
    expect(service).toMatch(/generateNarrative/);
    expect(service).toMatch(/explain\(/);
    expect(service).toMatch(/summarize\(/);
    expect(service).toMatch(/identifyTrends/);
    expect(service).toMatch(/compareRuns/);
    expect(service).not.toMatch(/requestReportRun/);
    expect(service).not.toMatch(/\.admit\(/);
    expect(service).not.toMatch(/\.deliver\(/);
    expect(service).not.toMatch(/certify/);
    expect(service).not.toMatch(/createOrder/);
  });
});
