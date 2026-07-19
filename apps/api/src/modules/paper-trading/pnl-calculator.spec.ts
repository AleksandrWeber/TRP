import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaperPosition } from './domain/paper-position';
import type { TradeResult } from './domain/trade-result';
import { PnLCalculator } from './pnl-calculator';

const OPEN: PaperPosition = {
  id: 'position-1',
  strategyId: 'strategy-1',
  symbol: 'BTCUSDT',
  side: 'LONG',
  quantity: 2,
  entryPrice: 100,
  entryTime: '2026-01-01T00:00:00.000Z',
  status: 'OPEN',
};

const CLOSED: PaperPosition = { ...OPEN, id: 'position-2', status: 'CLOSED' };

const CLOSE_TRADE: TradeResult = {
  positionId: 'position-2',
  action: 'CLOSE_LONG',
  price: 90,
  quantity: 2,
  realizedPnL: -20,
  timestamp: '2026-01-02T00:00:00.000Z',
};

describe('PnLCalculator (US010)', () => {
  const pnl = new PnLCalculator();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-01T00:00:00.000Z'));
  });

  afterEach(() => vi.useRealTimers());

  it('calculates simple long realized and unrealized PnL', () => {
    expect(pnl.realized(100, 110, 2)).toBe(20);
    expect(pnl.realized(100, 90, 2)).toBe(-20);
    expect(pnl.unrealized(OPEN, 105)).toBe(10);
  });

  it('builds portfolio totals from closed history and open marks', () => {
    const summary = pnl.portfolio([OPEN, CLOSED], [CLOSE_TRADE], { BTCUSDT: 115 });

    expect(summary).toEqual({
      realizedPnL: -20,
      unrealizedPnL: 30,
      totalPnL: 10,
      openPositions: 1,
      closedPositions: 1,
      positions: [
        {
          positionId: 'position-1',
          strategyId: 'strategy-1',
          symbol: 'BTCUSDT',
          quantity: 2,
          entryPrice: 100,
          currentPrice: 115,
          unrealizedPnL: 30,
        },
      ],
      generatedAt: '2026-02-01T00:00:00.000Z',
    });
  });

  it('returns an empty zero portfolio', () => {
    expect(pnl.portfolio([], [], {})).toMatchObject({
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalPnL: 0,
      openPositions: 0,
      closedPositions: 0,
      positions: [],
    });
  });

  it('requires a current price for every open symbol', () => {
    expect(() => pnl.portfolio([OPEN], [], {})).toThrow(/Current price missing/);
  });

  it('rejects invalid prices and quantities', () => {
    expect(() => pnl.realized(0, 100, 1)).toThrow(/entryPrice/);
    expect(() => pnl.realized(100, Number.NaN, 1)).toThrow(/exitPrice/);
    expect(() => pnl.realized(100, 110, 0)).toThrow(/quantity/);
  });
});
