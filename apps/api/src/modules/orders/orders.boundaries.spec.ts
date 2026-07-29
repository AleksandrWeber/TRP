import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ORDERS_ROOT = join(process.cwd(), 'src/modules/orders');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '/strategy-runtime',
  '/execution-engine',
  '/execution-adapter',
  '/signal-engine',
  '/evaluation-scheduler',
  '/paper-trading',
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

describe('US221 — Orders dependency boundaries', () => {
  it('forbids Strategy Runtime / Execution / research Signal Engine imports', () => {
    const files = listTsFiles(ORDERS_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/orders/')[1]} → ${importPath}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('module composition does not import StrategyRuntimeModule', () => {
    const moduleSource = readFileSync(join(ORDERS_ROOT, 'orders.module.ts'), 'utf8');
    expect(moduleSource).toMatch(/ORDER_PROPOSAL_PORT/);
    expect(moduleSource).toMatch(/OrderService/);
    expect(moduleSource).not.toContain('StrategyRuntimeModule');
    expect(moduleSource).not.toContain('RiskModule');
    expect(moduleSource).not.toContain('ExecutionEngineModule');
  });

  it('proposal port exposes proposeOrderFromSignalIntent without Runtime types', () => {
    const portSource = readFileSync(join(ORDERS_ROOT, 'ports/order-proposal.port.ts'), 'utf8');
    expect(portSource).toMatch(/proposeOrderFromSignalIntent/);
    expect(portSource).not.toMatch(/StrategyRuntime|RuntimeEvaluation|decideRuntimeEvaluation/);
  });

  it('intake mapping does not invoke Runtime evaluation', () => {
    const mappingSource = readFileSync(
      join(ORDERS_ROOT, 'domain/propose-from-signal-intent.ts'),
      'utf8',
    );
    expect(mappingSource).toMatch(/mapProposeOrderFromSignalIntent/);
    expect(mappingSource).toMatch(/NO_ACTION/);
    expect(mappingSource).not.toMatch(/decideRuntimeEvaluation|RuntimeEvaluationService/);
  });
});
