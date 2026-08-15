import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const FLOW_ROOT = join(process.cwd(), 'src/modules/product-flow');
const ORCHESTRATOR_ROOT = join(process.cwd(), 'src/modules/trading-orchestrator');
const SESSION_ROOT = join(process.cwd(), 'src/modules/trading-session');
const QUAL_ROOT = join(process.cwd(), 'src/modules/market-qualification');
const PROFILE_ROOT = join(process.cwd(), 'src/modules/market-profile');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
const AI_ROOT = join(process.cwd(), 'src/modules/ai-analytics');
const NOTIFICATION_ROOT = join(process.cwd(), 'src/modules/notification-delivery');
const LAKE_ROOT = join(process.cwd(), 'src/modules/knowledge-lake');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '/orders',
  '/risk/',
  '/execution-engine',
  '/execution-adapter',
  '/ledger',
  '/positions',
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

function moduleImports(root: string, segment: string): boolean {
  for (const file of listTsFiles(root)) {
    const source = readFileSync(file, 'utf8');
    for (const importPath of importPaths(source)) {
      if (importPath.replace(/\\/g, '/').includes(segment)) return true;
    }
  }
  return false;
}

describe('PC-15 — product-flow ownership boundaries', () => {
  it('may import Orchestrator, Session, Qualification, Profile, Reporting, AI, Notification, and Runtime; never Orders/Risk/Execution', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(FLOW_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/product-flow/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
    expect(moduleImports(FLOW_ROOT, 'trading-orchestrator')).toBe(true);
    expect(moduleImports(FLOW_ROOT, 'trading-session')).toBe(true);
    expect(moduleImports(FLOW_ROOT, 'market-qualification')).toBe(true);
    expect(moduleImports(FLOW_ROOT, 'market-profile')).toBe(true);
    expect(moduleImports(FLOW_ROOT, '/reporting')).toBe(true);
    expect(moduleImports(FLOW_ROOT, 'ai-analytics')).toBe(true);
    expect(moduleImports(FLOW_ROOT, 'notification-delivery')).toBe(true);
    expect(moduleImports(FLOW_ROOT, 'strategy-runtime')).toBe(true);
    expect(moduleImports(FLOW_ROOT, '/bot-facade')).toBe(false);
    expect(moduleImports(FLOW_ROOT, 'knowledge-lake')).toBe(false);
    expect(moduleImports(FLOW_ROOT, 'node-telegram-bot-api')).toBe(false);
    expect(moduleImports(FLOW_ROOT, 'telegraf')).toBe(false);
    expect(moduleImports(FLOW_ROOT, 'grammy')).toBe(false);
  });

  it('does not let Orchestrator import Session or product-flow', () => {
    expect(moduleImports(ORCHESTRATOR_ROOT, '/trading-session')).toBe(false);
    expect(moduleImports(ORCHESTRATOR_ROOT, '/product-flow')).toBe(false);
    expect(moduleImports(ORCHESTRATOR_ROOT, '/bot-facade')).toBe(false);
  });

  it('does not let Trading Session import Orchestrator or product-flow', () => {
    expect(moduleImports(SESSION_ROOT, 'trading-orchestrator')).toBe(false);
    expect(moduleImports(SESSION_ROOT, '/product-flow')).toBe(false);
  });

  it('keeps createsSession false in the Orchestrator owner module', () => {
    const intent = readFileSync(
      join(ORCHESTRATOR_ROOT, 'domain/session-handoff-intent.ts'),
      'utf8',
    );
    expect(intent).toMatch(/createsSession:\s*false/);
    expect(intent).not.toMatch(/createsSession:\s*true/);
  });

  it('does not let Qualification import Profile or product-flow', () => {
    expect(moduleImports(QUAL_ROOT, '/market-profile')).toBe(false);
    expect(moduleImports(QUAL_ROOT, '/product-flow')).toBe(false);
  });

  it('does not let Profile import product-flow; Profile may read Qualification', () => {
    expect(moduleImports(PROFILE_ROOT, '/product-flow')).toBe(false);
    expect(moduleImports(PROFILE_ROOT, 'market-qualification')).toBe(true);
  });

  it('does not let Reporting import AI, Notification, or product-flow; Lake stays read-only for Reporting', () => {
    expect(moduleImports(REPORTING_ROOT, '/ai-analytics')).toBe(false);
    expect(moduleImports(REPORTING_ROOT, '/notification-delivery')).toBe(false);
    expect(moduleImports(REPORTING_ROOT, '/product-flow')).toBe(false);
    expect(moduleImports(LAKE_ROOT, '/reporting')).toBe(false);
    expect(moduleImports(LAKE_ROOT, '/product-flow')).toBe(false);
  });

  it('does not let Notification Delivery import Reporting, product-flow, or Lake', () => {
    expect(moduleImports(NOTIFICATION_ROOT, '/reporting')).toBe(false);
    expect(moduleImports(NOTIFICATION_ROOT, '/product-flow')).toBe(false);
    expect(moduleImports(NOTIFICATION_ROOT, 'knowledge-lake')).toBe(false);
    expect(moduleImports(NOTIFICATION_ROOT, 'ai-analytics')).toBe(false);
  });

  it('does not implement Telegram Bot API or activate reserved channel adapters in product-flow', () => {
    for (const file of listTsFiles(FLOW_ROOT)) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/api\.telegram\.org/);
      expect(source).not.toMatch(/TelegramBot/);
      expect(source).not.toMatch(/node-telegram-bot-api/);
    }
    const dispatch = readFileSync(
      join(FLOW_ROOT, 'notification-channel-dispatch.service.ts'),
      'utf8',
    );
    expect(dispatch).toMatch(/completeTelegramConnect/);
    expect(dispatch).toMatch(/deliver/);
    expect(dispatch).not.toMatch(/ReportingModule/);
  });

  it('does not let AI Analytics import product-flow or Lake; AI may read Reporting', () => {
    expect(moduleImports(AI_ROOT, '/product-flow')).toBe(false);
    expect(moduleImports(AI_ROOT, 'knowledge-lake')).toBe(false);
    expect(moduleImports(AI_ROOT, 'reporting')).toBe(true);
  });
});
