import { FinancialDecimal } from '../financial';
import type { Position } from './domain/position';
import { isOpenPositionStatus } from './domain/position-status';
import { PositionInvalidStateError } from './position-errors';

/**
 * Pure financial calculator for the Position Engine (US205).
 * No financial calculations SHALL exist outside PositionCalculator.
 */
export class PositionCalculator {
  static calculateAverageEntryPrice(
    params: Readonly<{
      currentQuantity: string;
      currentAverageEntryPrice: string;
      addQuantity: string;
      addPrice: string;
    }>,
  ): string {
    const currentQty = FinancialDecimal.from(params.currentQuantity).assertNonNegative(
      'currentQuantity',
    );
    const addQty = FinancialDecimal.from(params.addQuantity).assertPositive('addQuantity');
    const addPrice = FinancialDecimal.from(params.addPrice).assertPositive('addPrice');
    if (currentQty.isZero()) {
      return addPrice.toString();
    }
    const currentAvg = FinancialDecimal.from(params.currentAverageEntryPrice).assertPositive(
      'currentAverageEntryPrice',
    );
    return currentAvg
      .times(currentQty)
      .plus(addPrice.times(addQty))
      .dividedBy(currentQty.plus(addQty))
      .toString();
  }

  static calculateUnrealizedPnL(position: Position): string {
    if (
      !isOpenPositionStatus(position.status) ||
      FinancialDecimal.from(position.quantity).isZero()
    ) {
      return '0';
    }
    const qty = FinancialDecimal.from(position.quantity);
    const mark = FinancialDecimal.from(position.markPrice);
    const avg = FinancialDecimal.from(position.averageEntryPrice);
    if (position.side === 'LONG') {
      return mark.minus(avg).times(qty).toString();
    }
    return avg.minus(mark).times(qty).toString();
  }

  static calculateRealizedPnL(
    params: Readonly<{
      side: Position['side'];
      averageEntryPrice: string;
      exitPrice: string;
      quantity: string;
    }>,
  ): string {
    const qty = FinancialDecimal.from(params.quantity).assertPositive('quantity');
    const exit = FinancialDecimal.from(params.exitPrice).assertPositive('exitPrice');
    const entry = FinancialDecimal.from(params.averageEntryPrice).assertPositive(
      'averageEntryPrice',
    );
    if (params.side === 'LONG') {
      return exit.minus(entry).times(qty).toString();
    }
    return entry.minus(exit).times(qty).toString();
  }

  /** Notional exposure: quantity × mark price. */
  static calculateExposure(position: Position): string {
    if (!isOpenPositionStatus(position.status)) return '0';
    return FinancialDecimal.from(position.quantity)
      .times(FinancialDecimal.from(position.markPrice))
      .toString();
  }

  /** Position market value equals exposure for open positions. */
  static calculatePositionValue(position: Position): string {
    return this.calculateExposure(position);
  }

  /**
   * Return % relative to cost basis (average entry × quantity).
   * Closed / zero-quantity positions return zero.
   */
  static calculateReturnPercent(position: Position): string {
    if (
      !isOpenPositionStatus(position.status) ||
      FinancialDecimal.from(position.quantity).isZero()
    ) {
      return '0';
    }
    const costBasis = FinancialDecimal.from(position.averageEntryPrice).times(
      FinancialDecimal.from(position.quantity),
    );
    if (costBasis.isZero()) return '0';
    const unrealized = FinancialDecimal.from(this.calculateUnrealizedPnL(position));
    return unrealized.dividedBy(costBasis).toString();
  }

  static assertValid(position: Position): void {
    FinancialDecimal.from(position.quantity).assertNonNegative('quantity');
    FinancialDecimal.from(position.entryPrice).assertPositive('entryPrice');
    FinancialDecimal.from(position.markPrice).assertPositive('markPrice');
    FinancialDecimal.from(position.averageEntryPrice).assertPositive('averageEntryPrice');
    FinancialDecimal.from(position.realizedPnL);
    FinancialDecimal.from(position.unrealizedPnL);

    if (position.status === 'CLOSED') {
      if (!FinancialDecimal.from(position.quantity).isZero()) {
        throw new PositionInvalidStateError('closed position quantity must be zero');
      }
      if (position.closedAt === null) {
        throw new PositionInvalidStateError('closed position must have closedAt');
      }
    }

    if (
      isOpenPositionStatus(position.status) &&
      FinancialDecimal.from(position.quantity).isZero()
    ) {
      throw new PositionInvalidStateError('open position quantity must be greater than zero');
    }
  }

  static withDerivedMetrics(position: Position): Position {
    this.assertValid(position);
    const unrealizedPnL = this.calculateUnrealizedPnL(position);
    return Object.freeze({
      ...position,
      unrealizedPnL,
    });
  }
}
