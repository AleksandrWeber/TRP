import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const directory = join(process.cwd(), 'src/modules/exchange-connectivity');

describe('Exchange connectivity isolation (W2-S02-b)', () => {
  it('keeps HTTP in the handshake client and never imports trading or SDK owners', async () => {
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
    expect(joined).not.toMatch(/from ['"]\.\.\/live-trading-engine/);
    expect(joined).not.toMatch(/from ['"]\.\.\/orders/);
    expect(joined).not.toMatch(/from ['"]\.\.\/positions/);
    expect(joined).not.toMatch(/from ['"]\.\.\/portfolio/);
    expect(joined).not.toMatch(/from ['"]\.\.\/market-data/);
    expect(joined).not.toMatch(/wss:\/\//);
    expect(joined).not.toMatch(/\/api\/v3\/account\b/);
    expect(joined).not.toMatch(/\/api\/v3\/order/);
    expect(joined).not.toMatch(/\/api\/v3\/ticker/);

    const fetchFiles = sources
      .filter((file) => /\bfetch\s*\(/.test(file.source))
      .map((file) => file.name);
    expect(fetchFiles).toEqual(['exchange-handshake.http.ts']);

    const vaultImporters = sources
      .filter((file) => /from ['"]\.\.\/secret-vault['"]/.test(file.source))
      .map((file) => file.name)
      .sort();
    expect(vaultImporters).toEqual([
      'exchange-connectivity.module.ts',
      'exchange-handshake.service.ts',
      'exchange-handshake.vault.ts',
    ]);

    const adapterSources = sources.filter((file) => file.name.endsWith('adapter.ts'));
    for (const adapter of adapterSources) {
      expect(adapter.source).not.toMatch(/from ['"]\.\.\/secret-vault['"]/);
      expect(adapter.source).not.toMatch(/from ['"]\.\.\/security-audit['"]/);
      expect(adapter.source).not.toMatch(/from ['"]\.\.\/workspace['"]/);
      expect(adapter.source).not.toMatch(/from ['"]\.\.\/auth['"]/);
    }
  });
});
