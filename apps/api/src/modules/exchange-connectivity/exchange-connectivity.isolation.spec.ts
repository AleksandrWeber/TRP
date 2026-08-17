import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const directory = join(process.cwd(), 'src/modules/exchange-connectivity');

describe('Exchange connectivity isolation (W2-S02-a)', () => {
  it('does not import HTTP clients, provider SDKs, or trading owners', async () => {
    const files = (await readdir(directory)).filter(
      (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'),
    );
    const sources = await Promise.all(files.map((name) => readFile(join(directory, name), 'utf8')));
    const joined = sources.join('\n');

    expect(joined).not.toMatch(/\bfetch\s*\(/);
    expect(joined).not.toMatch(/from ['"]axios['"]/);
    expect(joined).not.toMatch(/from ['"]undici['"]/);
    expect(joined).not.toMatch(/node:http/);
    expect(joined).not.toMatch(/binance-api|bybit-api|okx-api|ccxt/i);
    expect(joined).not.toMatch(/from ['"]\.\.\/live-trading-engine/);
    expect(joined).not.toMatch(/from ['"]\.\.\/orders/);
    expect(joined).not.toMatch(/from ['"]\.\.\/positions/);
    expect(joined).not.toMatch(/from ['"]\.\.\/secret-vault/);
  });
});
