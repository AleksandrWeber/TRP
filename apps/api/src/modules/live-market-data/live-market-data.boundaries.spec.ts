import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd(), 'src/modules/live-market-data');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '/strategy-runtime',
  '/strategy-trading-pipeline',
  '/orders',
  '/risk/',
  '/execution-engine',
  '/execution-adapter',
  '/positions',
  '/ledger',
  '/signal-engine',
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

describe('Live Market Data production ingest boundaries', () => {
  it('does not import Strategy Runtime, Orders, pipeline, or accounting', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/live-market-data/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('registers closed-candle ingest without a strategy poller', () => {
    const moduleSource = readFileSync(join(ROOT, 'live-market-data.module.ts'), 'utf8');
    expect(moduleSource).toMatch(/ClosedCandleIngestService/);
    expect(moduleSource).not.toContain('StrategyRuntimeModule');
    expect(moduleSource).not.toContain('OrdersModule');
    const ingest = readFileSync(join(ROOT, 'ingest/closed-candle-ingest.service.ts'), 'utf8');
    expect(ingest).not.toMatch(/while\s*\(\s*true\s*\)/);
    expect(ingest).not.toMatch(/setInterval/);
  });
});
