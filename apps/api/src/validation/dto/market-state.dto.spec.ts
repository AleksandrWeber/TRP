import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PC-10 market state DTOs', () => {
  it('exposes query/refresh transport only — no classify body', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/validation/dto/market-state.dto.ts'),
      'utf8',
    );
    expect(source).toContain('ListMarketStateHistoryQueryDto');
    expect(source).toContain('RefreshMarketStateBodyDto');
    expect(source).not.toContain('classifyMarketState');
    expect(source).not.toContain('class Classify');
  });
});
