import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_ROOT = join(process.cwd(), 'src/modules/teams-product');
const NOTIFICATION_ROOT = join(process.cwd(), 'src/modules/notification-delivery');

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

describe('PC-07 — teams-product ownership boundaries', () => {
  it('may compose Notification Delivery Teams methods; never Orders/Risk/Execution', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(PRODUCT_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        const normalized = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/teams-product/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('does not let Notification Delivery import the Teams product adapter', () => {
    for (const file of listTsFiles(NOTIFICATION_ROOT)) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toContain('/teams-product');
    }
  });
});
