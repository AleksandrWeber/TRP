import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
const LAKE_ROOT = join(process.cwd(), 'src/modules/knowledge-lake');

/**
 * Modules Reporting must not depend on (SoT / forbidden edges).
 * Knowledge Lake is an allowed read dependency in Epic 2+.
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
  '/paper-trading-engine',
  '/ai-analytics',
  '/modules/ai',
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

describe('RC-24 Epic 2 — Reporting dependency direction', () => {
  it('forbids SoT / Enforcement / AI imports; Lake reads are allowed', () => {
    const files = listTsFiles(REPORTING_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/reporting/')[1]} → ${importPath}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('may import Knowledge Lake (read consumption); Lake never imports Reporting', () => {
    const reportingFiles = listTsFiles(REPORTING_ROOT);
    const lakeImports: string[] = [];

    for (const file of reportingFiles) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        const normalized = importPath.replace(/\\/g, '/');
        if (
          normalized.includes('knowledge-lake') ||
          normalized.includes('/modules/knowledge-lake')
        ) {
          lakeImports.push(`${file.split('/reporting/')[1]} → ${importPath}`);
        }
      }
    }

    expect(lakeImports.length).toBeGreaterThan(0);

    const reverseDeps: string[] = [];
    for (const file of listTsFiles(LAKE_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        const normalized = importPath.replace(/\\/g, '/');
        if (normalized.includes('reporting') || normalized.includes('/modules/reporting')) {
          reverseDeps.push(`${file.split('/knowledge-lake/')[1]} → ${importPath}`);
        }
      }
    }

    expect(reverseDeps).toEqual([]);
  });

  it('module composition imports KnowledgeLakeModule and wires Lake + generation ports', () => {
    const moduleSource = readFileSync(join(REPORTING_ROOT, 'reporting.module.ts'), 'utf8');

    expect(moduleSource).toMatch(/ReportingBoundaryService/);
    expect(moduleSource).toMatch(/ReportingKnowledgeLakeReadService/);
    expect(moduleSource).toMatch(/ReportingGenerationService/);
    expect(moduleSource).toMatch(/ReportingQueryService/);
    expect(moduleSource).toMatch(/KnowledgeLakeModule/);
    expect(moduleSource).toMatch(/KNOWLEDGE_LAKE_QUERY_CONSUMER/);
    expect(moduleSource).toMatch(/REPORTING_SERVICE_PORT/);
    expect(moduleSource).toMatch(/REPORTING_QUERY_PORT/);
    expect(moduleSource).not.toMatch(/AiAnalyticsModule/);
    expect(moduleSource).not.toMatch(/RuntimeEnforcementModule/);
    expect(moduleSource).not.toMatch(/StrategyLibraryModule/);
    expect(moduleSource).not.toMatch(/TradingSessionModule/);
    expect(moduleSource).not.toMatch(/OrdersModule/);
  });
});
