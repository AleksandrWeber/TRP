import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ENFORCEMENT_ROOT = join(process.cwd(), 'src/modules/runtime-enforcement');
const LIBRARY_ROOT = join(process.cwd(), 'src/modules/strategy-library');

/** Modules Runtime Enforcement must not depend on as reverse SoT / forbidden edges. */
const FORBIDDEN_IMPORT_SEGMENTS = [
  '/orders',
  '/risk',
  '/risk-engine',
  '/execution-engine',
  '/execution-adapter',
  '/ledger',
  '/positions',
  '/knowledge-lake',
  '/trading-session',
  '/strategy-deployment',
  '/strategy-runtime',
  '/bot-facade',
  '/paper-trading',
  '/paper-trading-engine',
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

describe('RC-23 Epic 2 — Runtime Enforcement dependency direction', () => {
  it('forbids Session/Deployment/Lake/Orchestrator-adjacent imports', () => {
    const files = listTsFiles(ENFORCEMENT_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/runtime-enforcement/')[1]} → ${importPath}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('may import Strategy Library (read consumption); Library never imports Enforcement', () => {
    const enforcementFiles = listTsFiles(ENFORCEMENT_ROOT);
    const libraryImports: string[] = [];

    for (const file of enforcementFiles) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        const normalized = importPath.replace(/\\/g, '/');
        if (
          normalized.includes('strategy-library') ||
          normalized.includes('/modules/strategy-library')
        ) {
          libraryImports.push(`${file.split('/runtime-enforcement/')[1]} → ${importPath}`);
        }
      }
    }

    expect(libraryImports.length).toBeGreaterThan(0);

    const reverseDeps: string[] = [];
    for (const file of listTsFiles(LIBRARY_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        const normalized = importPath.replace(/\\/g, '/');
        if (
          normalized.includes('runtime-enforcement') ||
          normalized.includes('/modules/runtime-enforcement')
        ) {
          reverseDeps.push(`${file.split('/strategy-library/')[1]} → ${importPath}`);
        }
      }
    }

    expect(reverseDeps).toEqual([]);
  });

  it('module composition imports StrategyLibraryModule and wires Gate + Library consumers', () => {
    const moduleSource = readFileSync(
      join(ENFORCEMENT_ROOT, 'runtime-enforcement.module.ts'),
      'utf8',
    );

    expect(moduleSource).toMatch(/RuntimeEnforcementBoundaryService/);
    expect(moduleSource).toMatch(/RuntimeEnforcementLibraryReadService/);
    expect(moduleSource).toMatch(/RuntimeEnforcementGateService/);
    expect(moduleSource).toMatch(/StrategyLibraryModule/);
    expect(moduleSource).toMatch(/STRATEGY_LIBRARY_LOOKUP_CONSUMER/);
    expect(moduleSource).toMatch(/STRATEGY_LIBRARY_ELIGIBILITY_CONSUMER/);
    expect(moduleSource).toMatch(/RUNTIME_ENFORCEMENT_PORT/);
    expect(moduleSource).not.toMatch(/TradingSessionModule/);
    expect(moduleSource).not.toMatch(/StrategyDeploymentModule/);
    expect(moduleSource).not.toMatch(/KnowledgeLakeModule/);
  });
});
