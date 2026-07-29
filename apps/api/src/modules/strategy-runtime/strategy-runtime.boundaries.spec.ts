import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const RUNTIME_ROOT = join(process.cwd(), 'src/modules/strategy-runtime');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '/orders',
  '/risk',
  '/execution-engine',
  '/execution-adapter',
  '/positions',
  '/ledger',
  '/portfolio',
  '/trading-session',
  '/signal-engine',
  '/evaluation-scheduler',
  '/paper-trading',
] as const;

const ALLOWED_CROSS_MODULE_SEGMENTS = [
  '/strategy-deployment',
  '/event-processing',
  '/strategies',
  '/auth',
  '/workspace',
  '/storage/',
  '/validation/',
  '/identity',
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

describe('US216/US218/US219/US220 — Strategy Runtime dependency boundaries', () => {
  it('forbids Orders/Risk/Execution/Session/accounting imports', () => {
    const files = listTsFiles(RUNTIME_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/strategy-runtime/')[1]} → ${importPath}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('module composition depends on Strategy Deployment and Event Processing only', () => {
    const moduleSource = readFileSync(join(RUNTIME_ROOT, 'strategy-runtime.module.ts'), 'utf8');

    expect(moduleSource).toMatch(/StrategyDeploymentModule/);
    expect(moduleSource).toMatch(/EventProcessingModule/);
    expect(moduleSource).toMatch(/STRATEGY_RUNTIME_PORT/);
    expect(moduleSource).toMatch(/StrategyRuntimeService/);
    expect(moduleSource).toMatch(/RuntimeEvaluationService/);
    expect(moduleSource).toMatch(/RuntimeLifecycleCoordinator/);

    for (const forbidden of [
      'OrdersModule',
      'RiskModule',
      'ExecutionEngineModule',
      'ExecutionAdapterModule',
      'TradingSessionModule',
      'PositionsModule',
      'LedgerModule',
      'SignalEngineModule',
      'EvaluationSchedulerModule',
    ]) {
      expect(moduleSource).not.toContain(forbidden);
    }
  });

  it('port surface exposes lifecycle and evaluate without forbidden types', () => {
    const portSource = readFileSync(join(RUNTIME_ROOT, 'ports/strategy-runtime.port.ts'), 'utf8');
    for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
      expect(portSource.includes(forbidden)).toBe(false);
    }
    expect(portSource).toMatch(/StrategyRuntimePort/);
    expect(portSource).toMatch(/admitTick/);
    expect(portSource).toMatch(/\bevaluate\s*\(/);
    expect(portSource).toMatch(/\barm\b/);
    expect(portSource).toMatch(/\bpause\b/);
    expect(portSource).toMatch(/\bresume\b/);
    expect(portSource).toMatch(/\bstop\b/);
  });

  it('tick admission domain does not import Orders/Risk/Execution/Session', () => {
    const admissionSource = readFileSync(join(RUNTIME_ROOT, 'domain/tick-admission.ts'), 'utf8');
    for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
      expect(admissionSource.includes(forbidden)).toBe(false);
    }
    expect(admissionSource).toMatch(/admitClosedCandleTick/);
    expect(admissionSource).not.toMatch(/\bemitSignalIntent\b|\bsaveCheckpoint\b|\bRiskDecision\b/);
  });

  it('evaluation pipeline does not import Orders/Risk/Execution/Session/Signal Engine', () => {
    const evaluationSource = readFileSync(
      join(RUNTIME_ROOT, 'runtime-evaluation.service.ts'),
      'utf8',
    );
    for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
      expect(evaluationSource.includes(forbidden)).toBe(false);
    }
    expect(evaluationSource).toMatch(/RuntimeEvaluationService/);
    expect(evaluationSource).not.toMatch(/\bOrderService\b|\bRiskDecision\b|\bExecutionEngine\b/);
  });

  it('lifecycle coordinator does not import Session persistence or Orders', () => {
    const lifecycleSource = readFileSync(
      join(RUNTIME_ROOT, 'runtime-lifecycle.coordinator.ts'),
      'utf8',
    );
    for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
      expect(lifecycleSource.includes(forbidden)).toBe(false);
    }
    expect(lifecycleSource).not.toMatch(/prisma-strategy-checkpoint|prisma-signal-intent/);
  });

  it('documents allowed cross-module segments for future guard updates', () => {
    expect(ALLOWED_CROSS_MODULE_SEGMENTS.length).toBeGreaterThan(0);
  });
});
