import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_ROOT = join(process.cwd(), 'src/modules/knowledge-lake-product');
const LAKE_ROOT = join(process.cwd(), 'src/modules/knowledge-lake');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
const AI_ROOT = join(process.cwd(), 'src/modules/ai-analytics');
const RESEARCH_KNOWLEDGE_ROOT = join(process.cwd(), 'src/modules/knowledge');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '/orders',
  '/risk/',
  '/execution-engine',
  '/execution-adapter',
  '/ledger',
  '/positions',
  '/ai-analytics',
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

describe('PC-16 — knowledge-lake-product ownership boundaries', () => {
  it('may compose Lake queries, Reporting reads, and Library lookup; never Orders/Risk/Execution/AI', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(PRODUCT_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/knowledge-lake-product/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
    expect(moduleImports(PRODUCT_ROOT, '/knowledge-lake')).toBe(true);
    expect(moduleImports(PRODUCT_ROOT, '/reporting')).toBe(true);
    expect(moduleImports(PRODUCT_ROOT, '/strategy-library')).toBe(true);
  });

  it('does not let Knowledge Lake, Reporting, AI, or research knowledge import the product adapter', () => {
    expect(moduleImports(LAKE_ROOT, '/knowledge-lake-product')).toBe(false);
    expect(moduleImports(REPORTING_ROOT, '/knowledge-lake-product')).toBe(false);
    expect(moduleImports(AI_ROOT, '/knowledge-lake-product')).toBe(false);
    expect(moduleImports(RESEARCH_KNOWLEDGE_ROOT, '/knowledge-lake-product')).toBe(false);
    expect(moduleImports(LAKE_ROOT, '/reporting')).toBe(false);
  });

  it('exposes queries only — no admit, delete, or report generation on the product service', () => {
    const service = readFileSync(join(PRODUCT_ROOT, 'knowledge-lake-product.service.ts'), 'utf8');
    expect(service).toMatch(/list\(/);
    expect(service).toMatch(/search\(/);
    expect(service).toMatch(/history\(/);
    expect(service).not.toMatch(/\.admit\(/);
    expect(service).not.toMatch(/requestReportRun/);
    expect(service).not.toMatch(/generateNarrative/);
    expect(service).not.toMatch(/\.deliver\(/);
  });
});
