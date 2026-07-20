import { FinancialDecimal } from '../financial';
import type { RiskOrderRequest, RiskPortfolioSnapshot } from './domain/risk-evaluation-context';
import { createRiskViolation, type RiskViolation } from './domain/risk-violation';
import { ExposureCalculator } from './exposure-calculator';

/**
 * Validates available capital / portfolio balance (US207).
 * Reject if Available Balance < Required Capital.
 */
export class MarginValidator {
  static validateBalance(
    portfolio: RiskPortfolioSnapshot,
    order: RiskOrderRequest,
  ): RiskViolation | null {
    const required = ExposureCalculator.orderNotional(order);
    if (required === null) return null;

    const available = FinancialDecimal.from(portfolio.cash);
    if (available.compare(required) < 0) {
      return createRiskViolation({
        code: 'INSUFFICIENT_BALANCE',
        severity: 'REJECT',
        message: `available balance ${available.toString()} is less than required capital ${required}`,
      });
    }
    return null;
  }

  /**
   * Reject if Required margin exceeds available margin.
   * Required margin = order notional × marginRate (default 1).
   */
  static validateMargin(
    portfolio: RiskPortfolioSnapshot,
    order: RiskOrderRequest,
    marginRate = '1',
  ): RiskViolation | null {
    const notional = ExposureCalculator.orderNotional(order);
    if (notional === null) return null;

    const required = FinancialDecimal.from(notional).times(marginRate);
    const available = FinancialDecimal.from(portfolio.availableMargin);
    if (available.compare(required) < 0) {
      return createRiskViolation({
        code: 'INSUFFICIENT_MARGIN',
        severity: 'REJECT',
        message: `required margin ${required.toString()} exceeds available margin ${available.toString()}`,
      });
    }
    return null;
  }
}
