import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const directory = join(process.cwd(), 'src/modules/market-data-foundation');

describe('Market Data foundation isolation (W2-S03-b)', () => {
  it('keeps transport in the symbol HTTP client and never imports trading owners', async () => {
    const files = (await readdir(directory)).filter(
      (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'),
    );
    const sources = await Promise.all(
      files.map(async (name) => ({ name, source: await readFile(join(directory, name), 'utf8') })),
    );
    const joined = sources.map((file) => file.source).join('\n');

    expect(joined).not.toMatch(/from ['"]axios['"]/);
    expect(joined).not.toMatch(/from ['"]undici['"]/);
    expect(joined).not.toMatch(/node:http/);
    expect(joined).not.toMatch(/binance-api|bybit-api|okx-api|ccxt/i);
    expect(joined).not.toMatch(/\bWebSocket\b/);
    expect(joined).not.toMatch(/wss:\/\//);
    expect(joined).not.toMatch(/\bsetInterval\s*\(/);
    expect(joined).not.toMatch(/\bgetTicker\s*\(/);
    expect(joined).not.toMatch(/\bgetCandles\s*\(/);
    expect(joined).not.toMatch(/\bgetOrderBook\s*\(/);
    expect(joined).not.toMatch(/\bfetchTicker\s*\(/);
    expect(joined).not.toMatch(/from ['"]\.\.\/live-trading-engine/);
    expect(joined).not.toMatch(/from ['"]\.\.\/orders/);
    expect(joined).not.toMatch(/from ['"]\.\.\/positions/);
    expect(joined).not.toMatch(/from ['"]\.\.\/portfolio/);
    expect(joined).not.toMatch(/from ['"]\.\.\/market-data['"]/);
    expect(joined).not.toMatch(/from ['"]\.\.\/market-data-domain/);
    expect(joined).not.toMatch(/from ['"]\.\.\/live-market-data/);
    expect(joined).not.toMatch(/from ['"]\.\.\/connections/);
    expect(joined).not.toMatch(/from ['"]\.\.\/exchange-connectivity/);
    expect(joined).not.toMatch(/from ['"]\.\.\/secret-vault['"]/);

    const fetchFiles = sources
      .filter((file) => /\bfetch\s*\(/.test(file.source))
      .map((file) => file.name);
    expect(fetchFiles).toEqual(['market-symbol.http.ts']);

    const capabilitySource = sources.find(
      (file) => file.name === 'market-data-provider-capabilities.ts',
    );
    expect(capabilitySource?.source).not.toMatch(/REST/);
    expect(capabilitySource?.source).not.toMatch(/WEBSOCKET/);
    expect(capabilitySource?.source).not.toMatch(/HTTP/);

    const contractSource = sources.find((file) => file.name === 'market-data-adapter.contract.ts');
    expect(contractSource?.source).not.toMatch(/\bREST\b/);
    expect(contractSource?.source).not.toMatch(/\bWebSocket\b/);

    const discoverySource = sources.find((file) => file.name === 'market-symbol.discovery.ts');
    expect(discoverySource?.source).not.toMatch(/\bfetch\s*\(/);
    expect(discoverySource?.source).not.toMatch(/\bWebSocket\b/);
    expect(discoverySource?.source).not.toMatch(/\burl\b/);

    for (const adapter of sources.filter(
      (file) => file.name.endsWith('adapter.ts') && file.name !== 'market-data-adapter.ts',
    )) {
      expect(adapter.source).not.toMatch(/from ['"]\.\.\/secret-vault['"]/);
      expect(adapter.source).not.toMatch(/from ['"]\.\.\/security-audit['"]/);
      expect(adapter.source).not.toMatch(/from ['"]\.\.\/workspace['"]/);
      expect(adapter.source).not.toMatch(/from ['"]\.\.\/auth['"]/);
    }

    expect(joined).not.toMatch(/\/api\/v3\/ticker/);
    expect(joined).not.toMatch(/\/api\/v3\/klines/);
    expect(joined).not.toMatch(/\/api\/v3\/depth/);
    expect(joined).not.toMatch(/\/api\/v3\/account\b/);
    expect(joined).not.toMatch(/\/api\/v3\/order/);
  });
});
