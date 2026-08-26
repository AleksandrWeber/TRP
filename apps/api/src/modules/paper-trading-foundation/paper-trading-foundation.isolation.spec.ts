import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const directory = join(process.cwd(), 'src/modules/paper-trading-foundation');

describe('Paper Trading foundation isolation (W2-S04-a)', () => {
  it('never references exchange venues, Market Data transport, orders, or Live Trading', async () => {
    const files = (await readdir(directory)).filter(
      (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'),
    );
    const sources = await Promise.all(
      files.map(async (name) => ({ name, source: await readFile(join(directory, name), 'utf8') })),
    );
    const joined = sources.map((file) => file.source).join('\n');

    expect(joined).not.toMatch(/\bBinance\b/);
    expect(joined).not.toMatch(/\bBybit\b/);
    expect(joined).not.toMatch(/\bOKX\b/);
    expect(joined).not.toMatch(/Ticker API|Candlestick API|Order Book API/i);
    expect(joined).not.toMatch(/from ['"]axios['"]/);
    expect(joined).not.toMatch(/\bWebSocket\b/);
    expect(joined).not.toMatch(/wss:\/\//);
    expect(joined).not.toMatch(/from ['"]\.\.\/market-data-foundation/);
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
    expect(joined).not.toMatch(/matching engine|execution simulator|realized PnL|unrealized PnL/i);
  });
});
