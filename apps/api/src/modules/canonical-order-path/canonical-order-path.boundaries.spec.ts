import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd(), 'src/modules/canonical-order-path');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '/strategy-runtime',
  '/signal-engine',
  '/evaluation-scheduler',
  '/paper-trading',
  '/execution-adapter',
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

describe('US222 — Canonical Order Path dependency boundaries', () => {
  it('forbids Strategy Runtime and research Signal Engine imports', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/canonical-order-path/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('composes existing Orders + Risk + Execution Engine modules only', () => {
    const moduleSource = readFileSync(join(ROOT, 'canonical-order-path.module.ts'), 'utf8');
    expect(moduleSource).toMatch(/OrdersModule/);
    expect(moduleSource).toMatch(/RiskModule/);
    expect(moduleSource).toMatch(/ExecutionEngineModule/);
    expect(moduleSource).toMatch(/LedgerModule/);
    expect(moduleSource).not.toContain('StrategyRuntimeModule');
    expect(moduleSource).not.toContain('ExecutionAdapterModule');
    expect(moduleSource).not.toContain('SignalEngineModule');
  });

  it('delegates execution exclusively to ExecutionEngineService.submit', () => {
    const serviceSource = readFileSync(join(ROOT, 'canonical-order-path.service.ts'), 'utf8');
    expect(serviceSource).toMatch(/ExecutionEngineService/);
    expect(serviceSource).toMatch(/this\.execution\.submit/);
    expect(serviceSource).toMatch(/RiskDecisionService/);
    expect(serviceSource).not.toMatch(/EXECUTION_ADAPTER|PaperExecutionAdapter|adapter\.submit/);
    expect(serviceSource).not.toMatch(/StrategyRuntime|decideRuntimeEvaluation/);
  });
});
