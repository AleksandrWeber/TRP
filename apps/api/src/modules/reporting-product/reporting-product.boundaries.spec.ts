import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_ROOT = join(process.cwd(), 'src/modules/reporting-product');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
const AI_ROOT = join(process.cwd(), 'src/modules/ai-analytics');
const NOTIFICATION_ROOT = join(process.cwd(), 'src/modules/notification-delivery');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '/orders',
  '/risk/',
  '/execution-engine',
  '/execution-adapter',
  '/ledger',
  '/positions',
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

describe('PC-05 — reporting-product ownership boundaries', () => {
  it('may compose Reporting queries, AI narrative reads, and Notification delivery reads; never Orders/Risk/Execution', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(PRODUCT_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/reporting-product/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
    expect(moduleImports(PRODUCT_ROOT, '/reporting')).toBe(true);
    expect(moduleImports(PRODUCT_ROOT, '/product-flow')).toBe(true);
    expect(moduleImports(PRODUCT_ROOT, 'notification-delivery')).toBe(true);
  });

  it('does not let Reporting import the product adapter, AI, or Notification', () => {
    expect(moduleImports(REPORTING_ROOT, '/reporting-product')).toBe(false);
    expect(moduleImports(REPORTING_ROOT, '/ai-analytics')).toBe(false);
    expect(moduleImports(REPORTING_ROOT, '/notification-delivery')).toBe(false);
    expect(moduleImports(REPORTING_ROOT, '/product-flow')).toBe(false);
  });

  it('does not let AI or Notification import the Reporting product adapter', () => {
    expect(moduleImports(AI_ROOT, '/reporting-product')).toBe(false);
    expect(moduleImports(NOTIFICATION_ROOT, '/reporting-product')).toBe(false);
    expect(moduleImports(NOTIFICATION_ROOT, '/reporting')).toBe(false);
  });

  it('exposes queries only — no report generation or deliver() on the product service', () => {
    const service = readFileSync(join(PRODUCT_ROOT, 'reporting-product.service.ts'), 'utf8');
    expect(service).toMatch(/listRuns/);
    expect(service).toMatch(/getRun/);
    expect(service).toMatch(/listDefinitions/);
    expect(service).not.toMatch(/requestReportRun/);
    expect(service).not.toMatch(/\.deliver\(/);
    expect(service).not.toMatch(/compareRuns/);
  });
});
