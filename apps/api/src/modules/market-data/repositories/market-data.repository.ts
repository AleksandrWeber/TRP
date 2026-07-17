import type { Instrument } from '../instrument';
import type { MarketBar } from '../market-bar';
import type { MarketBarId } from '../market-bar-id';
import type { Timeframe } from '../timeframe';

/**
 * Query for range reads / deletes (US115).
 * Always scoped by workspace + instrument + timeframe + time bounds.
 */
export type MarketDataRangeQuery = {
  workspaceId: string;
  instrument: Instrument | string;
  timeframe: Timeframe;
  /** Inclusive ISO-8601 lower bound. */
  from: string;
  /** Inclusive ISO-8601 upper bound. */
  to: string;
};

/**
 * Persistence contract for MarketBar aggregates (US115).
 * Storage operations only — no REST / Prisma / backtesting.
 */
export interface MarketDataRepository {
  saveBars(bars: MarketBar[]): void;
  /** Returns null when missing OR when the bar belongs to a different workspace. */
  findById(id: MarketBarId | string, workspaceId: string): MarketBar | null;
  /** Bars matching workspace / instrument / timeframe within [from, to], sorted by timestamp ascending. */
  findRange(query: MarketDataRangeQuery): MarketBar[];
  /** Deletes matching bars; returns number removed. */
  deleteRange(query: MarketDataRangeQuery): number;
}
