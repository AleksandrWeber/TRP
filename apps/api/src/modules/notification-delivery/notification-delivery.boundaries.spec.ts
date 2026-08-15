import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd(), 'src/modules/notification-delivery');

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
  '/reporting',
  '/ai-analytics',
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

describe('RC-24 Epic 6 — Notification Delivery dependency direction', () => {
  it('forbids Reporting / AI / Library / Runtime / Session / Orders imports', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.') && !importPath.startsWith('..')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/notification-delivery/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('module composition does not import Reporting or Runtime modules', () => {
    const moduleSource = readFileSync(join(ROOT, 'notification-delivery.module.ts'), 'utf8');
    expect(moduleSource).toMatch(/NOTIFICATION_SERVICE_PORT/);
    expect(moduleSource).toMatch(/TELEGRAM_CHANNEL_ADAPTER/);
    expect(moduleSource).not.toMatch(/ReportingModule/);
    expect(moduleSource).not.toMatch(/AiAnalyticsModule/);
    expect(moduleSource).not.toMatch(/RuntimeEnforcementModule/);
    expect(moduleSource).not.toMatch(/StrategyLibraryModule/);
    expect(moduleSource).not.toMatch(/TradingSessionModule/);
  });
});
