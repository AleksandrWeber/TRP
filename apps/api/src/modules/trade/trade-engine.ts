import { randomUUID } from 'node:crypto';
import { toInstrument, type Instrument } from '../market-data/instrument';
import type { PortfolioEngine } from '../portfolio/portfolio-engine';
import type { CloseTradeInput, OpenTradeInput } from './trade-execution';
import type { Trade } from './trade';
import { toTradeId } from './trade-id';
import { TradeSide } from './trade-side';
import { TradeStatus } from './trade-status';

/**
 * Virtual trade execution engine for backtesting (US121).
 * Updates PortfolioEngine via applyExecution — no broker / slippage / commission / leverage.
 * Bound to a single instrument for the session.
 */
export class TradeEngine {
  private readonly instrument: Instrument;
  private readonly open = new Map<string, Trade>();
  private readonly closed: Trade[] = [];

  constructor(
    private readonly portfolio: PortfolioEngine,
    instrument: Instrument | string,
  ) {
    assertNonEmpty(String(instrument), 'instrument');
    this.instrument = toInstrument(String(instrument).trim());
  }

  openTrade(input: OpenTradeInput): Trade {
    assertPositiveFinite(input.quantity, 'quantity');
    assertPositiveFinite(input.entryPrice, 'entryPrice');
    assertNonEmpty(input.entryTimestamp, 'entryTimestamp');

    const portfolio = this.portfolio.getPortfolio();
    const notional = input.quantity * input.entryPrice;

    if (input.side === TradeSide.Buy && portfolio.cash < notional) {
      throw new Error('insufficient cash to open Buy trade (no leverage)');
    }

    const trade: Trade = {
      id: toTradeId(input.id?.trim() || randomUUID()),
      portfolioId: portfolio.id,
      instrument: this.instrument,
      side: input.side,
      quantity: input.quantity,
      entryPrice: input.entryPrice,
      entryTimestamp: input.entryTimestamp.trim(),
      status: TradeStatus.Open,
    };

    this.open.set(trade.id, trade);

    const cashDelta = input.side === TradeSide.Buy ? -notional : notional;
    this.portfolio.applyExecution({
      timestamp: trade.entryTimestamp,
      cashDelta,
      unrealizedPnL: this.computeUnrealizedPnL(input.entryPrice),
    });

    return cloneTrade(trade);
  }

  closeTrade(input: CloseTradeInput): Trade {
    assertNonEmpty(input.tradeId, 'tradeId');
    assertPositiveFinite(input.exitPrice, 'exitPrice');
    assertNonEmpty(input.exitTimestamp, 'exitTimestamp');

    const existing = this.open.get(input.tradeId.trim());
    if (!existing) {
      throw new Error(`Open trade not found: ${input.tradeId}`);
    }

    const exitPrice = input.exitPrice;
    const exitTimestamp = input.exitTimestamp.trim();
    const notional = existing.quantity * exitPrice;
    const realizedPnLDelta =
      existing.side === TradeSide.Buy
        ? (exitPrice - existing.entryPrice) * existing.quantity
        : (existing.entryPrice - exitPrice) * existing.quantity;

    const cashDelta = existing.side === TradeSide.Buy ? notional : -notional;

    this.open.delete(existing.id);
    const closed: Trade = {
      ...existing,
      exitPrice,
      exitTimestamp,
      status: TradeStatus.Closed,
    };
    this.closed.push(closed);

    this.portfolio.applyExecution({
      timestamp: exitTimestamp,
      cashDelta,
      realizedPnLDelta,
      unrealizedPnL: this.computeUnrealizedPnL(exitPrice),
    });

    return cloneTrade(closed);
  }

  getOpenTrades(): Trade[] {
    return Array.from(this.open.values()).map(cloneTrade);
  }

  getClosedTrades(): Trade[] {
    return this.closed.map(cloneTrade);
  }

  getInstrument(): Instrument {
    return this.instrument;
  }

  /**
   * Optional mark-to-market of open positions (e.g. on each bar close).
   * No-op when there are no open trades.
   */
  markToMarket(price: number, timestamp: string): void {
    assertPositiveFinite(price, 'price');
    assertNonEmpty(timestamp, 'timestamp');
    if (this.open.size === 0) return;

    this.portfolio.applyExecution({
      timestamp: timestamp.trim(),
      cashDelta: 0,
      unrealizedPnL: this.computeUnrealizedPnL(price),
    });
  }

  /** Classic unrealized PnL of all open positions at `markPrice`. */
  private computeUnrealizedPnL(markPrice: number): number {
    let value = 0;
    for (const trade of this.open.values()) {
      value +=
        trade.side === TradeSide.Buy
          ? (markPrice - trade.entryPrice) * trade.quantity
          : (trade.entryPrice - markPrice) * trade.quantity;
    }
    return value;
  }

  /** Signed market value of open positions (long +, short −). */
  computePositionMarketValue(markPrice: number): number {
    let value = 0;
    for (const trade of this.open.values()) {
      value +=
        trade.side === TradeSide.Buy ? trade.quantity * markPrice : -trade.quantity * markPrice;
    }
    return value;
  }
}

function cloneTrade(trade: Trade): Trade {
  return {
    id: trade.id,
    portfolioId: trade.portfolioId,
    instrument: trade.instrument,
    side: trade.side,
    quantity: trade.quantity,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    entryTimestamp: trade.entryTimestamp,
    exitTimestamp: trade.exitTimestamp,
    status: trade.status,
  };
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}

function assertPositiveFinite(value: number, field: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive finite number`);
  }
}
