import { FinancialDecimal } from '../financial';
import type { RiskOpenPosition, RiskOrderRequest } from './domain/risk-evaluation-context';

/**
 * Pure exposure calculations for Risk Engine (US207).
 */
export class ExposureCalculator {
  /** Order notional = quantity × effective price, or null when price unavailable. */
  static orderNotional(order: RiskOrderRequest): string | null {
    const price = effectivePrice(order);
    if (price === null) return null;
    return FinancialDecimal.from(order.quantity).times(price).toString();
  }

  static totalOpenExposure(positions: readonly RiskOpenPosition[]): string {
    return positions
      .reduce(
        (sum, position) => sum.plus(FinancialDecimal.from(position.exposure).abs()),
        FinancialDecimal.zero(),
      )
      .toString();
  }

  static projectedExposure(
    positions: readonly RiskOpenPosition[],
    order: RiskOrderRequest,
  ): string | null {
    const notional = this.orderNotional(order);
    if (notional === null) return null;
    return FinancialDecimal.from(this.totalOpenExposure(positions)).plus(notional).toString();
  }

  /**
   * Exposure as percent of equity: (projectedExposure / equity) * 100.
   * Returns null when equity is zero or price unavailable.
   */
  static exposurePercentOfEquity(
    positions: readonly RiskOpenPosition[],
    order: RiskOrderRequest,
    equity: string,
  ): string | null {
    const projected = this.projectedExposure(positions, order);
    if (projected === null) return null;
    const equityValue = FinancialDecimal.from(equity);
    if (equityValue.isZero()) return null;
    return FinancialDecimal.from(projected).dividedBy(equityValue).times('100').toString();
  }

  static symbolExposure(positions: readonly RiskOpenPosition[], symbol: string): string {
    const normalized = symbol.trim().toUpperCase();
    return positions
      .filter((p) => p.symbol.toUpperCase() === normalized)
      .reduce(
        (sum, position) => sum.plus(FinancialDecimal.from(position.exposure).abs()),
        FinancialDecimal.zero(),
      )
      .toString();
  }
}

export function effectivePrice(order: RiskOrderRequest): string | null {
  if (
    order.requestedPrice !== null &&
    order.requestedPrice !== undefined &&
    order.requestedPrice !== ''
  ) {
    return order.requestedPrice;
  }
  if (
    order.referencePrice !== null &&
    order.referencePrice !== undefined &&
    order.referencePrice !== ''
  ) {
    return order.referencePrice;
  }
  return null;
}
