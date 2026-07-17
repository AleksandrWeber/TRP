import type { MarketBar } from '../market-bar';
import type { MarketBarId } from '../market-bar-id';
import type { MarketDataRangeQuery, MarketDataRepository } from './market-data.repository';

/**
 * In-memory MarketDataRepository (Map-backed) (US115).
 * No filesystem, database, or serialization.
 */
export class InMemoryMarketDataRepository implements MarketDataRepository {
  private readonly byId = new Map<string, MarketBar>();

  saveBars(bars: MarketBar[]): void {
    for (const bar of bars) {
      this.byId.set(bar.id, cloneBar(bar));
    }
  }

  findById(id: MarketBarId | string, workspaceId: string): MarketBar | null {
    const found = this.byId.get(id);
    if (!found || found.workspaceId !== workspaceId) return null;
    return cloneBar(found);
  }

  findRange(query: MarketDataRangeQuery): MarketBar[] {
    return this.matchRange(query)
      .map(cloneBar)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  deleteRange(query: MarketDataRangeQuery): number {
    const matched = this.matchRange(query);
    for (const bar of matched) {
      this.byId.delete(bar.id);
    }
    return matched.length;
  }

  private matchRange(query: MarketDataRangeQuery): MarketBar[] {
    const instrument = String(query.instrument);
    return Array.from(this.byId.values()).filter(
      (bar) =>
        bar.workspaceId === query.workspaceId &&
        bar.instrument === instrument &&
        bar.timeframe === query.timeframe &&
        bar.timestamp >= query.from &&
        bar.timestamp <= query.to,
    );
  }
}

function cloneBar(bar: MarketBar): MarketBar {
  return {
    id: bar.id,
    workspaceId: bar.workspaceId,
    instrument: bar.instrument,
    timeframe: bar.timeframe,
    timestamp: bar.timestamp,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  };
}
