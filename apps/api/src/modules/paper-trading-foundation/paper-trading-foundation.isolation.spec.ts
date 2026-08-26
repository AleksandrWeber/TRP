import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const directory = join(process.cwd(), 'src/modules/paper-trading-foundation');

describe('Paper Trading foundation isolation (W2-S04-b)', () => {
  it('consumes abstract Market Data only and never executes or fills', async () => {
    const files = (await readdir(directory)).filter(
      (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'),
    );
    const sources = await Promise.all(
      files.map(async (name) => ({ name, source: await readFile(join(directory, name), 'utf8') })),
    );
    const joined = sources.map((file) => file.source).join('\n');

    expect(joined).not.toMatch(/Ticker API|Candlestick API|Order Book API/i);
    expect(joined).not.toMatch(/from ['"]axios['"]/);
    expect(joined).not.toMatch(/\bWebSocket\b/);
    expect(joined).not.toMatch(/wss:\/\//);
    expect(joined).not.toMatch(/from ['"]\.\.\/market-data-domain/);
    expect(joined).not.toMatch(/from ['"]\.\.\/live-market-data/);
    expect(joined).not.toMatch(/from ['"]\.\.\/connections/);
    expect(joined).not.toMatch(/from ['"]\.\.\/exchange-connectivity/);
    expect(joined).not.toMatch(/from ['"]\.\.\/live-trading-engine/);
    expect(joined).not.toMatch(/from ['"]\.\.\/orders/);
    expect(joined).not.toMatch(/from ['"]\.\.\/positions/);
    expect(joined).not.toMatch(/from ['"]\.\.\/portfolio/);
    expect(joined).not.toMatch(/from ['"]\.\.\/paper-trading['"]/);
    expect(joined).not.toMatch(/from ['"]\.\.\/paper-trading-engine/);
    expect(joined).not.toMatch(/from ['"]\.\.\/secret-vault['"]/);
    expect(joined).not.toMatch(/execution simulator|realized PnL|unrealized PnL/i);
    expect(joined).not.toMatch(/binance-api|bybit-api|okx-api|ccxt/i);
    expect(joined).not.toMatch(/market-ticker|market-candle|market-order-book\.http/i);

    // May import Market Data catalog/cache only — never matching/fill logic.
    expect(joined).not.toMatch(/MatchingEngine|matchOrder|createFill|applyFill/i);
  });
});
