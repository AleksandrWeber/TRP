import { beforeEach, describe, expect, it } from 'vitest';
import { PortfolioEngine } from '../portfolio/portfolio-engine';
import { TradeEngine } from './trade-engine';
import { TradeSide } from './trade-side';
import { TradeStatus } from './trade-status';

describe('TradeEngine (US121)', () => {
  let portfolio: PortfolioEngine;
  let trades: TradeEngine;

  beforeEach(() => {
    portfolio = new PortfolioEngine();
    portfolio.initialize({
      workspaceId: 'ws-1',
      initialCapital: 10_000,
      id: 'pf-1',
      timestamp: '2026-07-17T09:00:00.000Z',
    });
    trades = new TradeEngine(portfolio, 'BTCUSDT');
  });

  it('opens a Buy trade, debits cash, and keeps equity stable with zero unrealized at entry', () => {
    const trade = trades.openTrade({
      side: TradeSide.Buy,
      quantity: 2,
      entryPrice: 100,
      entryTimestamp: '2026-07-17T10:00:00.000Z',
      id: 't-1',
    });

    expect(trade).toMatchObject({
      id: 't-1',
      portfolioId: 'pf-1',
      instrument: 'BTCUSDT',
      side: TradeSide.Buy,
      quantity: 2,
      entryPrice: 100,
      status: TradeStatus.Open,
    });
    expect(trades.getOpenTrades()).toHaveLength(1);
    expect(portfolio.getPortfolio().cash).toBe(9_800);
    expect(portfolio.getPortfolio().equity).toBe(10_000);
    expect(portfolio.snapshot().unrealizedPnL).toBe(0);
    expect(trades.computePositionMarketValue(100)).toBe(200);
    expect(portfolio.getPortfolio().cash + trades.computePositionMarketValue(100)).toBe(10_000);
  });

  it('closes a Buy trade and realizes PnL through PortfolioEngine.applyExecution', () => {
    const opened = trades.openTrade({
      side: TradeSide.Buy,
      quantity: 1,
      entryPrice: 100,
      entryTimestamp: '2026-07-17T10:00:00.000Z',
    });

    const closed = trades.closeTrade({
      tradeId: opened.id,
      exitPrice: 110,
      exitTimestamp: '2026-07-17T11:00:00.000Z',
    });

    expect(closed.status).toBe(TradeStatus.Closed);
    expect(closed.exitPrice).toBe(110);
    expect(trades.getOpenTrades()).toHaveLength(0);
    expect(trades.getClosedTrades()).toHaveLength(1);
    expect(portfolio.getPortfolio().cash).toBe(10_010);
    expect(portfolio.getPortfolio().equity).toBe(10_010);
    expect(portfolio.snapshot().realizedPnL).toBe(10);
    expect(portfolio.snapshot().unrealizedPnL).toBe(0);
  });

  it('opens and closes a Sell (short) trade without leverage', () => {
    const opened = trades.openTrade({
      side: TradeSide.Sell,
      quantity: 1,
      entryPrice: 100,
      entryTimestamp: '2026-07-17T10:00:00.000Z',
    });

    expect(portfolio.getPortfolio().cash).toBe(10_100);
    expect(portfolio.getPortfolio().equity).toBe(10_000);
    expect(portfolio.snapshot().unrealizedPnL).toBe(0);

    trades.markToMarket(90, '2026-07-17T10:30:00.000Z');
    expect(portfolio.snapshot().unrealizedPnL).toBe(10);
    expect(portfolio.getPortfolio().equity).toBe(10_010);
    expect(portfolio.getPortfolio().cash + trades.computePositionMarketValue(90)).toBe(10_010);

    trades.closeTrade({
      tradeId: opened.id,
      exitPrice: 90,
      exitTimestamp: '2026-07-17T11:00:00.000Z',
    });

    expect(portfolio.getPortfolio().cash).toBe(10_010);
    expect(portfolio.snapshot().realizedPnL).toBe(10);
    expect(portfolio.snapshot().unrealizedPnL).toBe(0);
    expect(portfolio.getPortfolio().equity).toBe(10_010);
  });

  it('rejects Buy when cash is insufficient (no leverage)', () => {
    expect(() =>
      trades.openTrade({
        side: TradeSide.Buy,
        quantity: 200,
        entryPrice: 100,
        entryTimestamp: '2026-07-17T10:00:00.000Z',
      }),
    ).toThrow(/insufficient cash/i);
  });

  it('rejects closing an unknown trade', () => {
    expect(() =>
      trades.closeTrade({
        tradeId: 'missing',
        exitPrice: 100,
        exitTimestamp: '2026-07-17T10:00:00.000Z',
      }),
    ).toThrow(/not found/i);
  });
});
