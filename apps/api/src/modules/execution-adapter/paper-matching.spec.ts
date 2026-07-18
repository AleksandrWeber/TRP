import { describe, expect, it } from 'vitest';
import { M2_PAPER_FILL_CONFIGURATION } from './paper-fill-configuration';
import { matchPaperOrder, type PaperMatchInput } from './paper-matching';

const base = {
  adapterOrderId: 'paper_order_match',
  executionContextHash: 'ctx-hash',
  instrument: 'BTCUSDT',
  quantity: '2',
  referencePrice: '100',
  occurredAt: '2026-07-18T18:30:00.000Z',
  configuration: M2_PAPER_FILL_CONFIGURATION,
} as const;

function market(side: 'buy' | 'sell', overrides: Partial<PaperMatchInput> = {}): PaperMatchInput {
  return { ...base, side, type: 'market', limitPrice: null, ...overrides };
}

function limit(side: 'buy' | 'sell', limitPrice: string, referencePrice: string): PaperMatchInput {
  return { ...base, side, type: 'limit', limitPrice, referencePrice };
}

describe('US168 — deterministic market execution', () => {
  it('fills a market buy all-or-none with deterministic slippage and fee', () => {
    const result = matchPaperOrder(market('buy'));
    expect(result.outcome).toBe('filled');
    if (result.outcome !== 'filled') throw new Error('expected fill');
    expect(result.fill).toMatchObject({
      side: 'buy',
      price: '100.05',
      quantity: '2',
      grossNotional: '200.1',
      fee: '0.2001',
      sequence: 1,
    });
  });

  it('fills a market sell with symmetric downward slippage', () => {
    const result = matchPaperOrder(market('sell'));
    if (result.outcome !== 'filled') throw new Error('expected fill');
    expect(result.fill).toMatchObject({ price: '99.95', grossNotional: '199.9', fee: '0.1999' });
  });

  it('is deterministic: identical inputs produce identical facts', () => {
    expect(matchPaperOrder(market('buy'))).toEqual(matchPaperOrder(market('buy')));
  });
});

describe('US169 — deterministic limit execution and resting', () => {
  it('fills a crossing buy limit bounded by the limit price', () => {
    const result = matchPaperOrder(limit('buy', '100', '100'));
    if (result.outcome !== 'filled') throw new Error('expected fill');
    expect(result.fill.price).toBe('100');
    expect(result.fill.grossNotional).toBe('200');
    expect(result.fill.fee).toBe('0.2');
  });

  it('leaves a non-crossing buy limit resting without a fill', () => {
    expect(matchPaperOrder(limit('buy', '100', '101')).outcome).toBe('acknowledged');
  });

  it('fills a crossing sell limit bounded by the limit price', () => {
    const result = matchPaperOrder(limit('sell', '100', '100'));
    if (result.outcome !== 'filled') throw new Error('expected fill');
    expect(result.fill.price).toBe('100');
  });

  it('leaves a non-crossing sell limit resting without a fill', () => {
    expect(matchPaperOrder(limit('sell', '100', '99')).outcome).toBe('acknowledged');
  });

  it('returns frozen facts and never mutates domain state', () => {
    const result = matchPaperOrder(market('buy'));
    if (result.outcome !== 'filled') throw new Error('expected fill');
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.fill)).toBe(true);
  });
});
