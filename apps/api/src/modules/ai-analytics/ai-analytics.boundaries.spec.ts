import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const AI_ROOT = join(process.cwd(), 'src/modules/ai-analytics');

/** AI Analytics must not depend on SoT / Lake directly (Reporting is allowed). */
const FORBIDDEN_IMPORT_SEGMENTS = [
  '/orders',
  '/risk',
  '/risk-engine',
  '/execution-engine',
  '/ledger',
  '/positions',
  '/knowledge-lake',
  '/trading-session',
  '/strategy-deployment',
  '/strategy-runtime',
  '/runtime-enforcement',
  '/strategy-library',
  '/bot-facade',
  '/paper-trading',
  '/modules/ai/',
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

describe('RC-24 Epic 5 — AI Analytics dependency direction', () => {
  it('forbids Lake / Session / Library / Enforcement / Orders / Ledger imports', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(AI_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/ai-analytics/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('may import Reporting (query consumer only)', () => {
    const reportingImports: string[] = [];
    for (const file of listTsFiles(AI_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        const normalized = importPath.replace(/\\/g, '/');
        if (normalized.includes('reporting') || normalized.includes('/modules/reporting')) {
          reportingImports.push(`${file.split('/ai-analytics/')[1]} → ${importPath}`);
        }
      }
    }
    expect(reportingImports.length).toBeGreaterThan(0);
  });

  it('module composition wires Reporting query consumer + AIAnalyticsPort', () => {
    const moduleSource = readFileSync(join(AI_ROOT, 'ai-analytics.module.ts'), 'utf8');
    expect(moduleSource).toMatch(/ReportingModule/);
    expect(moduleSource).toMatch(/REPORTING_QUERY_PORT/);
    expect(moduleSource).toMatch(/REPORTING_QUERY_CONSUMER/);
    expect(moduleSource).toMatch(/AI_ANALYTICS_PORT/);
    expect(moduleSource).toMatch(/AiAnalyticsService/);
    expect(moduleSource).not.toMatch(/KnowledgeLakeModule/);
    expect(moduleSource).not.toMatch(/StrategyLibraryModule/);
    expect(moduleSource).not.toMatch(/RuntimeEnforcementModule/);
    expect(moduleSource).not.toMatch(/TradingSessionModule/);
  });
});
