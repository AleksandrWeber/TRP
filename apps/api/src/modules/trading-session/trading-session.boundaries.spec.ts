import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SESSION_ROOT = join(process.cwd(), 'src/modules/trading-session');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '/orders',
  '/risk',
  '/execution-engine',
  '/execution-adapter',
  '/positions',
  '/ledger',
  '/portfolio',
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

describe('US217/US220 — Trading Session dependency boundaries', () => {
  it('forbids Orders/Risk/Execution/accounting imports', () => {
    const files = listTsFiles(SESSION_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/trading-session/')[1]} → ${importPath}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('module composition binds Deployment + RuntimePort without forbidden modules', () => {
    const moduleSource = readFileSync(join(SESSION_ROOT, 'trading-session.module.ts'), 'utf8');

    expect(moduleSource).toMatch(/StrategyDeploymentModule/);
    expect(moduleSource).toMatch(/StrategyRuntimeModule/);

    for (const forbidden of [
      'OrdersModule',
      'RiskModule',
      'ExecutionEngineModule',
      'ExecutionAdapterModule',
      'PositionsModule',
      'LedgerModule',
      'SignalEngineModule',
      'EvaluationSchedulerModule',
    ]) {
      expect(moduleSource).not.toContain(forbidden);
    }
  });

  it('service notifies RuntimePort lifecycle without Runtime persistence access', () => {
    const serviceSource = readFileSync(join(SESSION_ROOT, 'trading-session.service.ts'), 'utf8');
    expect(serviceSource).toMatch(/STRATEGY_RUNTIME_PORT/);
    expect(serviceSource).toMatch(/loadContext/);
    expect(serviceSource).toMatch(/\.arm\(/);
    expect(serviceSource).toMatch(/\.pause\(/);
    expect(serviceSource).toMatch(/\.resume\(/);
    expect(serviceSource).toMatch(/\.stop\(/);
    expect(serviceSource).not.toMatch(/emitSignalIntent/);
    expect(serviceSource).not.toMatch(/saveCheckpoint/);
    expect(serviceSource).not.toMatch(/prisma-signal-intent/);
    expect(serviceSource).not.toMatch(/prisma-strategy-checkpoint/);
  });
});
