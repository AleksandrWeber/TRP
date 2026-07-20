import { describe, expect, it } from 'vitest';
import {
  createPaperPosition,
  PAPER_POSITION_SIDES,
  PAPER_POSITION_STATUSES,
  type PaperPosition,
} from './paper-position';
import { createTradeResult, PAPER_TRADE_ACTIONS, type TradeResult } from './trade-result';

const POSITION: PaperPosition = {
  id: 'position-1',
  strategyId: 'strategy-1',
  symbol: 'BTCUSDT',
  side: 'LONG',
  quantity: 2,
  entryPrice: 100,
  entryTime: '2026-01-01T00:00:00.000Z',
  status: 'OPEN',
};

const TRADE: TradeResult = {
  positionId: 'position-1',
  action: 'OPEN_LONG',
  price: 100,
  quantity: 2,
  realizedPnL: 0,
  timestamp: '2026-01-01T00:00:00.000Z',
};

describe('Paper trading domain models (US010)', () => {
  it('defines the long-only position lifecycle', () => {
    expect(PAPER_POSITION_SIDES).toEqual(['LONG']);
    expect(PAPER_POSITION_STATUSES).toEqual(['OPEN', 'CLOSED']);
    expect(PAPER_TRADE_ACTIONS).toEqual(['OPEN_LONG', 'CLOSE_LONG', 'IGNORED']);
  });

  it('creates frozen valid positions and trade results', () => {
    expect(Object.isFrozen(createPaperPosition(POSITION))).toBe(true);
    expect(Object.isFrozen(createTradeResult(TRADE))).toBe(true);
  });

  it('rejects invalid position identity, symbol, quantity, price, and time', () => {
    expect(() => createPaperPosition({ ...POSITION, id: '' })).toThrow(/id/);
    expect(() => createPaperPosition({ ...POSITION, strategyId: '' })).toThrow(/strategyId/);
    expect(() => createPaperPosition({ ...POSITION, symbol: 'btc/usdt' })).toThrow(/symbol/);
    expect(() => createPaperPosition({ ...POSITION, quantity: 0 })).toThrow(/quantity/);
    expect(() => createPaperPosition({ ...POSITION, entryPrice: Number.NaN })).toThrow(
      /entryPrice/,
    );
    expect(() => createPaperPosition({ ...POSITION, entryTime: 'invalid' })).toThrow(/entryTime/);
  });

  it('validates executed and ignored trade-result invariants', () => {
    expect(() => createTradeResult({ ...TRADE, positionId: null })).toThrow(/positionId/);
    expect(() =>
      createTradeResult({
        ...TRADE,
        positionId: null,
        action: 'IGNORED',
        quantity: 1,
      }),
    ).toThrow(/Ignored/);
    expect(() => createTradeResult({ ...TRADE, price: 0 })).toThrow(/price/);
    expect(() => createTradeResult({ ...TRADE, realizedPnL: Number.NaN })).toThrow(/realizedPnL/);
    expect(() => createTradeResult({ ...TRADE, timestamp: 'invalid' })).toThrow(/timestamp/);
  });

  it('accepts the canonical ignored result', () => {
    expect(
      createTradeResult({
        positionId: null,
        action: 'IGNORED',
        price: 100,
        quantity: 0,
        realizedPnL: 0,
        timestamp: '2026-01-01T00:00:00.000Z',
      }),
    ).toMatchObject({ action: 'IGNORED', positionId: null });
  });
});
