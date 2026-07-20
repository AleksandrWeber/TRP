import { describe, expect, it } from 'vitest';
import {
  applyPortfolioFinancials,
  createPortfolio,
  DEFAULT_PORTFOLIO_INITIAL_CASH,
} from './domain/portfolio';
import { PortfolioCalculator } from './portfolio-calculator';
import { PortfolioInvalidStateError } from './portfolio-errors';

const NOW = '2026-07-20T12:00:00.000Z';

function samplePortfolio(
  overrides: Partial<{
    cash: string;
    realizedPnL: string;
    unrealizedPnL: string;
    usedMargin: string;
    initialCash: string;
  }> = {},
) {
  const base = createPortfolio({
    id: 'pf-1',
    workspaceId: 'ws-1',
    ownerId: 'owner-1',
    currency: 'USD',
    initialCash: overrides.initialCash ?? DEFAULT_PORTFOLIO_INITIAL_CASH,
    createdAt: NOW,
    updatedAt: NOW,
  });
  if (
    overrides.cash === undefined &&
    overrides.realizedPnL === undefined &&
    overrides.unrealizedPnL === undefined &&
    overrides.usedMargin === undefined
  ) {
    return base;
  }
  return applyPortfolioFinancials(
    base,
    {
      cash: overrides.cash ?? base.cash,
      realizedPnL: overrides.realizedPnL ?? base.realizedPnL,
      unrealizedPnL: overrides.unrealizedPnL ?? base.unrealizedPnL,
      usedMargin: overrides.usedMargin ?? base.usedMargin,
    },
    NOW,
  );
}

describe('US204 PortfolioCalculator', () => {
  it('calculates balance as cash', () => {
    const portfolio = samplePortfolio({ cash: '25000.5' });
    expect(PortfolioCalculator.calculateBalance(portfolio)).toEqual({ cash: '25000.5' });
  });

  it('calculates equity as balance + realized + unrealized', () => {
    const portfolio = samplePortfolio({
      cash: '100000',
      realizedPnL: '500',
      unrealizedPnL: '-200',
    });
    expect(PortfolioCalculator.calculateEquity(portfolio)).toEqual({
      equity: '100300',
      realizedPnL: '500',
      unrealizedPnL: '-200',
    });
  });

  it('calculates available margin as equity - used margin', () => {
    const portfolio = samplePortfolio({
      cash: '100000',
      realizedPnL: '0',
      unrealizedPnL: '0',
      usedMargin: '15000',
    });
    expect(PortfolioCalculator.calculateMargin(portfolio)).toEqual({
      usedMargin: '15000',
      availableMargin: '85000',
    });
  });

  it('calculates portfolio value and return', () => {
    const portfolio = samplePortfolio({
      cash: '100000',
      realizedPnL: '10000',
      unrealizedPnL: '0',
      initialCash: '100000',
    });
    expect(PortfolioCalculator.calculatePortfolioValue(portfolio)).toBe('110000');
    expect(PortfolioCalculator.calculatePortfolioReturn(portfolio)).toBe('0.1');
  });

  it('returns zero portfolio return when initial cash is zero', () => {
    const portfolio = samplePortfolio({
      cash: '0',
      initialCash: '0',
    });
    expect(PortfolioCalculator.calculatePortfolioReturn(portfolio)).toBe('0');
  });

  it('rejects negative equity', () => {
    const portfolio = samplePortfolio({
      cash: '100',
      realizedPnL: '-50',
      unrealizedPnL: '-60',
    });
    expect(() => PortfolioCalculator.calculateEquity(portfolio)).toThrow(
      PortfolioInvalidStateError,
    );
  });

  it('rejects available margin below zero', () => {
    const portfolio = samplePortfolio({
      cash: '1000',
      usedMargin: '1001',
    });
    expect(() => PortfolioCalculator.calculateMargin(portfolio)).toThrow(
      PortfolioInvalidStateError,
    );
  });

  it('assertValid passes for a consistent portfolio', () => {
    expect(() => PortfolioCalculator.assertValid(samplePortfolio())).not.toThrow();
  });
});
