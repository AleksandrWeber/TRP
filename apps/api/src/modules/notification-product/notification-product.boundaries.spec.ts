import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_ROOT = join(process.cwd(), 'src/modules/notification-product');
const NOTIFICATION_ROOT = join(process.cwd(), 'src/modules/notification-delivery');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
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

describe('PC-06 — notification-product ownership boundaries', () => {
  it('may compose Notification Delivery queries; never Orders/Risk/Execution', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(PRODUCT_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/notification-product/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
    expect(moduleImports(PRODUCT_ROOT, 'notification-delivery')).toBe(true);
  });

  it('does not let Notification Delivery import the product adapter or Reporting', () => {
    expect(moduleImports(NOTIFICATION_ROOT, '/notification-product')).toBe(false);
    expect(moduleImports(NOTIFICATION_ROOT, '/telegram-product')).toBe(false);
    expect(moduleImports(NOTIFICATION_ROOT, '/reporting')).toBe(false);
    expect(moduleImports(NOTIFICATION_ROOT, '/product-flow')).toBe(false);
  });

  it('does not let Reporting or product-flow import the Notification product adapter', () => {
    expect(moduleImports(REPORTING_ROOT, '/notification-product')).toBe(false);
    expect(moduleImports(FLOW_ROOT, '/notification-product')).toBe(false);
  });

  it('exposes queries and preference upserts only — no deliver, connect, test, or cron', () => {
    const service = readFileSync(join(PRODUCT_ROOT, 'notification-product.service.ts'), 'utf8');
    expect(service).toMatch(/getSettings/);
    expect(service).toMatch(/upsertPreferences/);
    expect(service).toMatch(/listDeliveries/);
    expect(service).not.toMatch(/\.deliver\(/);
    expect(service).not.toMatch(/connectTelegram/);
    expect(service).not.toMatch(/sendTestNotification/);
    expect(service).not.toMatch(/cron/i);
    expect(service).not.toMatch(/retryQueue/);
  });
});
