import type { ExecutedTrade } from './executed-trade';

/**
 * Counters of every scheduler signal the executor has processed for one
 * strategy (US016). HOLD and ignored/duplicate signals never create trades —
 * they only appear here.
 */
export type SignalStats = Readonly<{
  buy: number;
  sell: number;
  hold: number;
  /** BUY with a position already open, or SELL without a position. */
  ignored: number;
  /** Re-delivery of an already-processed signal (idempotency guard). */
  duplicates: number;
  /** Processing attempts that threw; the executor kept running. */
  failures: number;
}>;

/**
 * Per-strategy virtual portfolio view (US016). Derived from the trade store
 * at read time — realized figures come from CLOSED trades, unrealized from
 * the OPEN trade against the current cached market price.
 */
export type StrategyPortfolio = Readonly<{
  workspaceId: string;
  strategyId: string;
  /** The OPEN trade, or null when the strategy holds no position. */
  currentPosition: ExecutedTrade | null;
  unrealizedPnL: number;
  realizedPnL: number;
  /** Every executed trade (OPEN + CLOSED). */
  totalTrades: number;
  /** CLOSED trades with profitLoss > 0. */
  wins: number;
  /** CLOSED trades with profitLoss < 0 (break-even counts as neither). */
  losses: number;
  signalStats: SignalStats;
  /** ISO-8601 moment this view was generated. */
  generatedAt: string;
}>;

export function freezeSignalStats(stats: SignalStats): SignalStats {
  return Object.freeze({ ...stats });
}

export function freezeStrategyPortfolio(portfolio: StrategyPortfolio): StrategyPortfolio {
  return Object.freeze({ ...portfolio, signalStats: freezeSignalStats(portfolio.signalStats) });
}
