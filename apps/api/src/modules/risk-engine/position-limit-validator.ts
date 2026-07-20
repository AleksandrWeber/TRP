import { FinancialDecimal } from '../financial';
import type {
  RiskActiveOrder,
  RiskOpenPosition,
  RiskOrderRequest,
  RiskPortfolioSnapshot,
} from './domain/risk-evaluation-context';
import type { RiskPolicy } from './domain/risk-policy';
import { createRiskViolation, type RiskViolation } from './domain/risk-violation';
import { ExposureCalculator } from './exposure-calculator';
import { MarginValidator } from './margin-validator';

/**
 * Validates position quantity / notional / open-count limits (US207).
 */
export class PositionLimitValidator {
  static validatePositionSize(
    order: RiskOrderRequest,
    maxQuantity?: string | null,
    maxNotional?: string | null,
  ): RiskViolation[] {
    const violations: RiskViolation[] = [];
    const quantity = FinancialDecimal.from(order.quantity);

    if (maxQuantity !== undefined && maxQuantity !== null && maxQuantity !== '') {
      if (quantity.compare(maxQuantity) > 0) {
        violations.push(
          createRiskViolation({
            code: 'POSITION_SIZE_EXCEEDED',
            severity: 'REJECT',
            message: `order quantity ${quantity.toString()} exceeds max quantity ${maxQuantity}`,
          }),
        );
      }
    }

    if (maxNotional !== undefined && maxNotional !== null && maxNotional !== '') {
      const notional = ExposureCalculator.orderNotional(order);
      if (notional !== null && FinancialDecimal.from(notional).compare(maxNotional) > 0) {
        violations.push(
          createRiskViolation({
            code: 'POSITION_NOTIONAL_EXCEEDED',
            severity: 'REJECT',
            message: `order notional ${notional} exceeds max notional ${maxNotional}`,
          }),
        );
      }
    }

    return violations;
  }

  static validateMaxOpenPositions(
    openPositions: readonly RiskOpenPosition[],
    maxOpenPositions: number,
  ): RiskViolation | null {
    if (openPositions.length >= maxOpenPositions) {
      return createRiskViolation({
        code: 'MAX_OPEN_POSITIONS',
        severity: 'REJECT',
        message: `open positions ${openPositions.length} exceeds configured limit ${maxOpenPositions}`,
      });
    }
    return null;
  }

  static validateExposure(
    openPositions: readonly RiskOpenPosition[],
    order: RiskOrderRequest,
    equity: string,
    maxExposurePercent: string,
  ): RiskViolation | null {
    const percent = ExposureCalculator.exposurePercentOfEquity(openPositions, order, equity);
    if (percent === null) return null;
    if (FinancialDecimal.from(percent).compare(maxExposurePercent) > 0) {
      return createRiskViolation({
        code: 'EXPOSURE_EXCEEDED',
        severity: 'REJECT',
        message: `projected exposure ${percent}% of equity exceeds limit ${maxExposurePercent}%`,
      });
    }
    return null;
  }

  static validateDuplicateOrders(
    order: RiskOrderRequest,
    activeOrders: readonly RiskActiveOrder[],
  ): RiskViolation | null {
    const duplicate = activeOrders.find(
      (active) =>
        active.id !== order.id &&
        active.symbol.toUpperCase() === order.symbol.toUpperCase() &&
        active.side.toUpperCase() === order.side.toUpperCase() &&
        active.type.toUpperCase() === order.type.toUpperCase() &&
        active.quantity === order.quantity &&
        (active.requestedPrice ?? null) === (order.requestedPrice ?? null),
    );
    if (duplicate) {
      return createRiskViolation({
        code: 'DUPLICATE_ORDER',
        severity: 'REJECT',
        message: `equivalent active order already exists (${duplicate.id})`,
      });
    }
    return null;
  }

  static validateDailyLoss(
    portfolio: RiskPortfolioSnapshot,
    maxDailyLoss: string,
  ): RiskViolation | null {
    const realized = FinancialDecimal.from(portfolio.realizedPnL);
    if (realized.isNegative()) {
      const loss = realized.abs();
      if (loss.compare(maxDailyLoss) > 0) {
        return createRiskViolation({
          code: 'DAILY_LOSS_EXCEEDED',
          severity: 'REJECT',
          message: `daily realized loss ${loss.toString()} exceeds threshold ${maxDailyLoss}`,
        });
      }
    }
    return null;
  }
}

/**
 * Dispatches a single policy against evaluation context.
 */
export function evaluatePolicy(
  policy: RiskPolicy,
  context: Readonly<{
    order: RiskOrderRequest;
    portfolio: RiskPortfolioSnapshot;
    openPositions: readonly RiskOpenPosition[];
    activeOrders: readonly RiskActiveOrder[];
  }>,
): RiskViolation[] {
  if (!policy.enabled) return [];

  const { order, portfolio, openPositions, activeOrders } = context;
  const config = policy.configuration;

  switch (policy.name) {
    case 'portfolio_balance': {
      const violation = MarginValidator.validateBalance(portfolio, order);
      return violation ? [violation] : [];
    }
    case 'position_size': {
      return PositionLimitValidator.validatePositionSize(
        order,
        asString(config.maxQuantity),
        asString(config.maxNotional),
      );
    }
    case 'exposure': {
      const maxPercent = asString(config.maxExposurePercent) ?? '100';
      const violation = PositionLimitValidator.validateExposure(
        openPositions,
        order,
        portfolio.equity,
        maxPercent,
      );
      return violation ? [violation] : [];
    }
    case 'margin': {
      const marginRate = asString(config.marginRate) ?? '1';
      const violation = MarginValidator.validateMargin(portfolio, order, marginRate);
      return violation ? [violation] : [];
    }
    case 'max_open_positions': {
      const max = asNumber(config.maxOpenPositions) ?? 50;
      const violation = PositionLimitValidator.validateMaxOpenPositions(openPositions, max);
      return violation ? [violation] : [];
    }
    case 'duplicate_orders': {
      const violation = PositionLimitValidator.validateDuplicateOrders(order, activeOrders);
      return violation ? [violation] : [];
    }
    case 'daily_loss': {
      const maxLoss = asString(config.maxDailyLoss) ?? '100000';
      const violation = PositionLimitValidator.validateDailyLoss(portfolio, maxLoss);
      return violation ? [violation] : [];
    }
    default:
      return [];
  }
}

function asString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

function asNumber(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}
