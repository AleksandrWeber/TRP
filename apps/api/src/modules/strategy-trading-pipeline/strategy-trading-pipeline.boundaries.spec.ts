import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd(), 'src/modules/strategy-trading-pipeline');

const FORBIDDEN_IMPORT_SEGMENTS = [
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

describe('US223 — Strategy Trading Pipeline dependency boundaries', () => {
  it('forbids research Signal Engine and direct Execution Adapter imports', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/strategy-trading-pipeline/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('composes Runtime + Orders proposal + canonical path + Position accounting', () => {
    const moduleSource = readFileSync(join(ROOT, 'strategy-trading-pipeline.module.ts'), 'utf8');
    expect(moduleSource).toMatch(/StrategyRuntimeModule/);
    expect(moduleSource).toMatch(/OrdersModule/);
    expect(moduleSource).toMatch(/CanonicalOrderPathModule/);
    expect(moduleSource).toMatch(/PositionsModule/);
    expect(moduleSource).not.toContain('ExecutionAdapterModule');
    expect(moduleSource).not.toContain('SignalEngineModule');
    expect(moduleSource).not.toContain('EvaluationSchedulerModule');
  });

  it('delegates to existing ports without strategy-specific accounting', () => {
    const serviceSource = readFileSync(join(ROOT, 'strategy-trading-pipeline.service.ts'), 'utf8');
    expect(serviceSource).toMatch(/STRATEGY_RUNTIME_PORT/);
    expect(serviceSource).toMatch(/ORDER_PROPOSAL_PORT/);
    expect(serviceSource).toMatch(/CanonicalOrderPathService/);
    expect(serviceSource).toMatch(/PositionAccountingConsumer/);
    expect(serviceSource).toMatch(/orderFillRecordedEnvelope/);
    expect(serviceSource).not.toMatch(/applyFillToPosition|recordFill\(/);
    expect(serviceSource).not.toMatch(/EXECUTION_ADAPTER|PaperExecutionAdapter/);
  });
});
