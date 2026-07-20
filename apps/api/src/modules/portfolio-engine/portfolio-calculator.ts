import { FinancialDecimal } from '../financial';
import { createBalance, type Balance } from './domain/balance';
import { createEquity, type Equity } from './domain/equity';
import { createMargin, type Margin } from './domain/margin';
import type { Portfolio } from './domain/portfolio';
import { PortfolioInvalidStateError } from './portfolio-errors';

/**
 * Pure financial calculator for the Portfolio Engine (US204).
 * Controllers must never perform calculations — all metrics go through here.
 */
export class PortfolioCalculator {
  static calculateBalance(portfolio: Portfolio): Balance {
    return createBalance(portfolio.cash);
  }

  static calculateEquity(portfolio: Portfolio): Equity {
    const balance = FinancialDecimal.from(portfolio.cash);
    const realizedPnL = FinancialDecimal.from(portfolio.realizedPnL);
    const unrealizedPnL = FinancialDecimal.from(portfolio.unrealizedPnL);
    const equity = balance.plus(realizedPnL).plus(unrealizedPnL);

    if (equity.isNegative()) {
      throw new PortfolioInvalidStateError('equity must be non-negative');
    }

    return createEquity({
      equity: equity.toString(),
      realizedPnL: realizedPnL.toString(),
      unrealizedPnL: unrealizedPnL.toString(),
    });
  }

  static calculateMargin(portfolio: Portfolio): Margin {
    const equity = FinancialDecimal.from(this.calculateEquity(portfolio).equity);
    const usedMargin = FinancialDecimal.from(portfolio.usedMargin).assertNonNegative('usedMargin');
    const availableMargin = equity.minus(usedMargin);

    if (availableMargin.isNegative()) {
      throw new PortfolioInvalidStateError('availableMargin must be non-negative');
    }

    return createMargin({
      usedMargin: usedMargin.toString(),
      availableMargin: availableMargin.toString(),
    });
  }

  /** Portfolio value equals equity. */
  static calculatePortfolioValue(portfolio: Portfolio): string {
    return this.calculateEquity(portfolio).equity;
  }

  /**
   * Return relative to initial cash: (equity - initialCash) / initialCash.
   * When initial cash is zero, return is zero.
   */
  static calculatePortfolioReturn(portfolio: Portfolio): string {
    const initial = FinancialDecimal.from(portfolio.initialCash);
    if (initial.isZero()) return '0';
    const equity = FinancialDecimal.from(this.calculateEquity(portfolio).equity);
    return equity.minus(initial).dividedBy(initial).toString();
  }

  /**
   * Validates all business invariants. Throws if the portfolio would be invalid.
   */
  static assertValid(portfolio: Portfolio): void {
    FinancialDecimal.from(portfolio.cash).assertNonNegative('cash');
    FinancialDecimal.from(portfolio.usedMargin).assertNonNegative('usedMargin');
    this.calculateEquity(portfolio);
    this.calculateMargin(portfolio);
  }

  static toFinancialState(portfolio: Portfolio): Readonly<{
    balance: Balance;
    equity: Equity;
    margin: Margin;
    portfolioValue: string;
    portfolioReturn: string;
  }> {
    this.assertValid(portfolio);
    return Object.freeze({
      balance: this.calculateBalance(portfolio),
      equity: this.calculateEquity(portfolio),
      margin: this.calculateMargin(portfolio),
      portfolioValue: this.calculatePortfolioValue(portfolio),
      portfolioReturn: this.calculatePortfolioReturn(portfolio),
    });
  }
}
