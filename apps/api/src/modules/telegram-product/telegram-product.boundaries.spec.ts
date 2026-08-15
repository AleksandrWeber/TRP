import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_ROOT = join(process.cwd(), 'src/modules/telegram-product');
const NOTIFICATION_ROOT = join(process.cwd(), 'src/modules/notification-delivery');
const NOTIFICATION_PRODUCT_ROOT = join(process.cwd(), 'src/modules/notification-product');
const FLOW_ROOT = join(process.cwd(), 'src/modules/product-flow');

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

describe('PC-07 — telegram-product ownership boundaries', () => {
  it('may compose Notification Delivery Telegram methods; never Orders/Risk/Execution', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(PRODUCT_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/telegram-product/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
    expect(moduleImports(PRODUCT_ROOT, 'notification-delivery')).toBe(true);
  });

  it('does not let Notification Delivery import the Telegram product adapter', () => {
    expect(moduleImports(NOTIFICATION_ROOT, '/telegram-product')).toBe(false);
    expect(moduleImports(NOTIFICATION_ROOT, '/notification-product')).toBe(false);
    expect(moduleImports(NOTIFICATION_PRODUCT_ROOT, '/telegram-product')).toBe(false);
    expect(moduleImports(FLOW_ROOT, '/telegram-product')).toBe(false);
  });

  it('does not introduce Bot API, cron, or reserved-channel activation', () => {
    for (const file of listTsFiles(PRODUCT_ROOT)) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/api\.telegram\.org/);
      expect(source).not.toMatch(/node-telegram-bot-api/);
      expect(source).not.toMatch(/TelegramBot/);
      expect(source).not.toMatch(/telegraf/);
      expect(source).not.toMatch(/grammy/);
    }
    const service = readFileSync(join(PRODUCT_ROOT, 'telegram-product.service.ts'), 'utf8');
    expect(service).toMatch(/connectTelegram/);
    expect(service).toMatch(/completeTelegramConnect/);
    expect(service).toMatch(/verifyTelegramConnection/);
    expect(service).toMatch(/disconnectTelegram/);
    expect(service).toMatch(/sendTestNotification/);
    expect(service).not.toMatch(/\.deliver\(/);
    expect(service).not.toMatch(/cron/i);
    expect(service).not.toMatch(/retryQueue/);
    expect(service).toMatch(/inMemoryAdapterChatId/);
  });
});
