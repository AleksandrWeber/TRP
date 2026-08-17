import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createExchangeCapabilities } from '../exchange-adapter/domain/exchange-capabilities';
import {
  createExchangeConnection,
  type ExchangeConnection,
} from '../exchange-adapter/domain/exchange-connection';

const VAULT_ROOT = join(process.cwd(), 'src/modules/secret-vault');
const SCHEMA_PATH = join(process.cwd(), 'prisma/schema.prisma');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '/exchange-adapter',
  '/telegram-product',
  '/notification-delivery',
  '/notification-product',
  '/ai/',
  '/ai-analytics',
  'nodemailer',
  'openrouter',
] as const;

const SECRET_COLUMN_HINTS = [
  'apiKey',
  'api_key',
  'apiSecret',
  'api_secret',
  'secret',
  'password',
  'botToken',
  'bot_token',
  'ciphertext',
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

function exchangeConnectionModel(schema: string): string {
  const start = schema.indexOf('model ExchangeConnection {');
  const end = schema.indexOf('\n}', start);
  return schema.slice(start, end + 2);
}

describe('Secret Vault boundaries (V3-S03-c)', () => {
  it('does not import Exchange, Telegram, SMTP, OpenRouter, or AI consumers', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(VAULT_ROOT)) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/\bfetch\s*\(/);
      expect(source).not.toMatch(/process\.env\.OPENROUTER_API_KEY/);
      for (const importPath of importPaths(source)) {
        const normalized = importPath.replace(/\\/g, '/').toLowerCase();
        for (const forbidden of FORBIDDEN_IMPORT_SEGMENTS) {
          if (normalized.includes(forbidden)) {
            violations.push(`${file.split('/secret-vault/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('does not add secret columns to ExchangeConnection', () => {
    const connection: ExchangeConnection = createExchangeConnection({
      id: 'conn-1',
      workspaceId: 'ws-1',
      exchangeId: 'BINANCE',
      capabilities: createExchangeCapabilities({
        supportsSpot: true,
        supportsMargin: false,
        supportsFutures: false,
        supportsWebSocket: false,
        supportsMarketOrders: true,
        supportsLimitOrders: true,
        supportsOCO: false,
        supportsReduceOnly: false,
      }),
      createdAt: '2026-08-17T10:00:00.000Z',
      updatedAt: '2026-08-17T10:00:00.000Z',
    });
    const keys = Object.keys(connection);
    for (const hint of ['apiKey', 'apiSecret', 'secret', 'password', 'token', 'ciphertext']) {
      expect(keys).not.toContain(hint);
    }

    const model = exchangeConnectionModel(readFileSync(SCHEMA_PATH, 'utf8'));
    for (const hint of SECRET_COLUMN_HINTS) {
      expect(model.toLowerCase()).not.toContain(hint.toLowerCase());
    }
  });

  it('does not expose HTTP in the Vault module', () => {
    const moduleSource = readFileSync(join(VAULT_ROOT, 'secret-vault.module.ts'), 'utf8');
    expect(moduleSource).not.toMatch(/controllers:/);
    expect(moduleSource).not.toMatch(/Controller/);
  });
});
