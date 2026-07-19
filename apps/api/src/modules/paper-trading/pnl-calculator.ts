import { Injectable } from '@nestjs/common';
import type { PaperPosition } from './domain/paper-position';
import type { TradeResult } from './domain/trade-result';

export type OpenPositionPnL = Readonly<{
  positionId: string;
  strategyId: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
}>;

export type PortfolioSummary = Readonly<{
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  openPositions: number;
  closedPositions: number;
  positions: ReadonlyArray<OpenPositionPnL>;
  generatedAt: string;
}>;

/** Simple long-only PnL arithmetic (US010). No fees, slippage, or leverage. */
@Injectable()
export class PnLCalculator {
  realized(entryPrice: number, exitPrice: number, quantity: number): number {
    assertPrice(entryPrice, 'entryPrice');
    assertPrice(exitPrice, 'exitPrice');
    assertQuantity(quantity);
    return round8((exitPrice - entryPrice) * quantity);
  }

  unrealized(position: PaperPosition, currentPrice: number): number {
    assertPrice(currentPrice, 'currentPrice');
    return this.realized(position.entryPrice, currentPrice, position.quantity);
  }

  portfolio(
    positions: ReadonlyArray<PaperPosition>,
    history: ReadonlyArray<TradeResult>,
    currentPrices: Readonly<Record<string, number>>,
  ): PortfolioSummary {
    const open = positions.filter((position) => position.status === 'OPEN');
    const positionPnL = open.map((position): OpenPositionPnL => {
      const currentPrice = currentPrices[position.symbol];
      if (currentPrice === undefined) {
        throw new Error(`Current price missing for open paper position symbol: ${position.symbol}`);
      }
      return Object.freeze({
        positionId: position.id,
        strategyId: position.strategyId,
        symbol: position.symbol,
        quantity: position.quantity,
        entryPrice: position.entryPrice,
        currentPrice,
        unrealizedPnL: this.unrealized(position, currentPrice),
      });
    });
    const realizedPnL = round8(
      history
        .filter((result) => result.action === 'CLOSE_LONG')
        .reduce((sum, result) => sum + result.realizedPnL, 0),
    );
    const unrealizedPnL = round8(
      positionPnL.reduce((sum, position) => sum + position.unrealizedPnL, 0),
    );

    return Object.freeze({
      realizedPnL,
      unrealizedPnL,
      totalPnL: round8(realizedPnL + unrealizedPnL),
      openPositions: open.length,
      closedPositions: positions.length - open.length,
      positions: Object.freeze(positionPnL),
      generatedAt: new Date().toISOString(),
    });
  }
}

function assertPrice(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a finite positive number`);
  }
}

function assertQuantity(value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('quantity must be a finite positive number');
  }
}

function round8(value: number): number {
  return Math.round((value + Number.EPSILON) * 100_000_000) / 100_000_000;
}
