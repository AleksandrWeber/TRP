import type { MarketBar } from '../market-bar';
import type { MarketBarId } from '../market-bar-id';
import type { Timeframe } from '../timeframe';
import type { MarketDataRangeQuery, MarketDataRepository } from './market-data.repository';

/**
 * Fixed-width UTC timestamps (`Date.toISOString()`). For this shape, code-unit
 * order and `localeCompare` order are the same, so a sorted series can answer
 * an inclusive range with a binary search.
 */
const CANONICAL_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

type IndexedSeries = {
  bars: MarketBar[];
  /** Every stored timestamp matches {@link CANONICAL_TIMESTAMP}. */
  canonical: boolean;
};

type SeriesBucket = {
  removed: Set<string>;
  added: MarketBar[];
};

/**
 * In-memory MarketDataRepository (US115).
 * No filesystem, database, or serialization.
 * Stored bars are frozen copies of the caller's input. `findById` returns a
 * mutable copy because existing callers assign to that result. `findRange`
 * returns the frozen stored objects in a new array: replay only reads them,
 * and a caller cannot change stored values or the next query's order.
 *
 * Bars are also indexed by workspace, instrument, and timeframe in timestamp
 * order. Equal timestamps keep the order in which each id was first saved.
 */
export class InMemoryMarketDataRepository implements MarketDataRepository {
  private readonly byId = new Map<string, MarketBar>();
  private readonly insertionOrder = new Map<string, number>();
  private nextInsertionOrder = 0;
  private readonly series = new Map<string, Map<string, Map<string, IndexedSeries>>>();

  saveBars(bars: MarketBar[]): void {
    if (bars.length === 0) return;

    const groups = new Map<string, Map<string, Map<string, SeriesBucket>>>();
    let cachedBucket: SeriesBucket | null = null;
    let cachedWorkspace = '';
    let cachedInstrument = '';
    let cachedTimeframe: Timeframe | null = null;

    const bucketFor = (
      workspaceId: string,
      instrument: string,
      timeframe: Timeframe,
    ): SeriesBucket => {
      if (
        cachedBucket &&
        cachedWorkspace === workspaceId &&
        cachedInstrument === instrument &&
        cachedTimeframe === timeframe
      ) {
        return cachedBucket;
      }
      let byInstrument = groups.get(workspaceId);
      if (!byInstrument) {
        byInstrument = new Map();
        groups.set(workspaceId, byInstrument);
      }
      let byTimeframe = byInstrument.get(instrument);
      if (!byTimeframe) {
        byTimeframe = new Map();
        byInstrument.set(instrument, byTimeframe);
      }
      let bucket = byTimeframe.get(timeframe);
      if (!bucket) {
        bucket = { removed: new Set(), added: [] };
        byTimeframe.set(timeframe, bucket);
      }
      cachedBucket = bucket;
      cachedWorkspace = workspaceId;
      cachedInstrument = instrument;
      cachedTimeframe = timeframe;
      return bucket;
    };

    for (const bar of bars) {
      const stored = Object.freeze(cloneBar(bar));
      const previous = this.byId.get(stored.id);
      if (previous) {
        bucketFor(
          previous.workspaceId,
          String(previous.instrument),
          previous.timeframe,
        ).removed.add(previous.id);
      } else if (!this.insertionOrder.has(stored.id)) {
        this.insertionOrder.set(stored.id, this.nextInsertionOrder);
        this.nextInsertionOrder += 1;
      }
      this.byId.set(stored.id, stored);
      bucketFor(stored.workspaceId, String(stored.instrument), stored.timeframe).added.push(stored);
    }

    for (const [workspaceId, byInstrument] of groups) {
      for (const [instrument, byTimeframe] of byInstrument) {
        for (const [timeframe, bucket] of byTimeframe) {
          this.rebuildSeries(workspaceId, instrument, timeframe, bucket);
        }
      }
    }
  }

  findById(id: MarketBarId | string, workspaceId: string): MarketBar | null {
    const found = this.byId.get(id);
    if (!found || found.workspaceId !== workspaceId) return null;
    return cloneBar(found);
  }

  findRange(query: MarketDataRangeQuery): MarketBar[] {
    const series = this.readSeries(query.workspaceId, String(query.instrument), query.timeframe);
    if (!series) return [];
    const bounds = this.canonicalBounds(series, query);
    if (bounds) {
      return bounds.start >= bounds.end ? [] : series.bars.slice(bounds.start, bounds.end);
    }
    return this.scanSeries(series.bars, query);
  }

  deleteRange(query: MarketDataRangeQuery): number {
    const instrument = String(query.instrument);
    const series = this.readSeries(query.workspaceId, instrument, query.timeframe);
    if (!series) return 0;

    const bounds = this.canonicalBounds(series, query);
    if (bounds) {
      if (bounds.start >= bounds.end) return 0;
      this.deleteStored(series.bars, bounds.start, bounds.end);
      const remaining = series.bars.slice(0, bounds.start).concat(series.bars.slice(bounds.end));
      this.writeSeries(query.workspaceId, instrument, query.timeframe, remaining, series.canonical);
      return bounds.end - bounds.start;
    }

    const removed: MarketBar[] = [];
    const remaining: MarketBar[] = [];
    for (const bar of series.bars) {
      if (bar.timestamp >= query.from && bar.timestamp <= query.to) removed.push(bar);
      else remaining.push(bar);
    }
    this.deleteStored(removed, 0, removed.length);
    const canonical =
      series.canonical ||
      (remaining.length > 0 && remaining.every((bar) => isCanonicalTimestamp(bar.timestamp)));
    this.writeSeries(
      query.workspaceId,
      instrument,
      query.timeframe,
      remaining,
      canonical && remaining.length > 0,
    );
    return removed.length;
  }

  private rebuildSeries(
    workspaceId: string,
    instrument: string,
    timeframe: string,
    bucket: SeriesBucket,
  ): void {
    const existing = this.readSeries(workspaceId, instrument, timeframe);
    const kept =
      bucket.removed.size > 0
        ? (existing?.bars ?? []).filter((bar) => !bucket.removed.has(bar.id))
        : (existing?.bars ?? []);
    const additions = dedupeLastWrite(bucket.added);
    const merged = additions.length === 0 ? kept : kept.concat(additions);
    if (merged.length === 0) {
      this.writeSeries(workspaceId, instrument, timeframe, [], true);
      return;
    }

    let canonical =
      (existing?.canonical ?? true) &&
      additions.every((bar) => isCanonicalTimestamp(bar.timestamp));
    if (!canonical && bucket.removed.size > 0) {
      canonical = merged.every((bar) => isCanonicalTimestamp(bar.timestamp));
    }
    if (!isNonDecreasing(merged, this.insertionOrder, canonical)) {
      merged.sort((left, right) => compareBars(left, right, this.insertionOrder, canonical));
    }
    this.writeSeries(workspaceId, instrument, timeframe, merged, canonical);
  }

  private canonicalBounds(
    series: IndexedSeries,
    query: MarketDataRangeQuery,
  ): { start: number; end: number } | null {
    if (!series.canonical || !isCanonicalTimestamp(query.from) || !isCanonicalTimestamp(query.to))
      return null;
    return {
      start: lowerBound(series.bars, query.from),
      end: upperBound(series.bars, query.to),
    };
  }

  private scanSeries(bars: readonly MarketBar[], query: MarketDataRangeQuery): MarketBar[] {
    const matched: MarketBar[] = [];
    for (const bar of bars) {
      if (bar.timestamp >= query.from && bar.timestamp <= query.to) matched.push(bar);
    }
    return matched;
  }

  private deleteStored(bars: readonly MarketBar[], start: number, end: number): void {
    for (let index = start; index < end; index += 1) {
      const bar = bars[index]!;
      this.byId.delete(bar.id);
      this.insertionOrder.delete(bar.id);
    }
  }

  private readSeries(
    workspaceId: string,
    instrument: string,
    timeframe: string,
  ): IndexedSeries | undefined {
    return this.series.get(workspaceId)?.get(instrument)?.get(timeframe);
  }

  private writeSeries(
    workspaceId: string,
    instrument: string,
    timeframe: string,
    bars: MarketBar[],
    canonical: boolean,
  ): void {
    if (bars.length === 0) {
      const byInstrument = this.series.get(workspaceId);
      const byTimeframe = byInstrument?.get(instrument);
      byTimeframe?.delete(timeframe);
      if (byTimeframe && byTimeframe.size === 0) byInstrument?.delete(instrument);
      if (byInstrument && byInstrument.size === 0) this.series.delete(workspaceId);
      return;
    }

    let byInstrument = this.series.get(workspaceId);
    if (!byInstrument) {
      byInstrument = new Map();
      this.series.set(workspaceId, byInstrument);
    }
    let byTimeframe = byInstrument.get(instrument);
    if (!byTimeframe) {
      byTimeframe = new Map();
      byInstrument.set(instrument, byTimeframe);
    }
    byTimeframe.set(timeframe, { bars, canonical });
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

function isCanonicalTimestamp(value: string): boolean {
  return CANONICAL_TIMESTAMP.test(value);
}

function dedupeLastWrite(bars: MarketBar[]): MarketBar[] {
  if (bars.length < 2) return bars;
  const seen = new Set<string>();
  for (const bar of bars) {
    if (seen.has(bar.id)) {
      const last = new Map<string, MarketBar>();
      for (const item of bars) last.set(item.id, item);
      return [...last.values()];
    }
    seen.add(bar.id);
  }
  return bars;
}

function compareBars(
  left: MarketBar,
  right: MarketBar,
  order: Map<string, number>,
  canonical: boolean,
): number {
  const byTime = canonical
    ? compareCodeUnit(left.timestamp, right.timestamp)
    : left.timestamp.localeCompare(right.timestamp);
  if (byTime !== 0) return byTime;
  return (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0);
}

function compareCodeUnit(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function isNonDecreasing(
  bars: readonly MarketBar[],
  order: Map<string, number>,
  canonical: boolean,
): boolean {
  for (let index = 1; index < bars.length; index += 1) {
    if (compareBars(bars[index - 1]!, bars[index]!, order, canonical) > 0) return false;
  }
  return true;
}

function lowerBound(bars: readonly MarketBar[], from: string): number {
  let low = 0;
  let high = bars.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (bars[mid]!.timestamp < from) low = mid + 1;
    else high = mid;
  }
  return low;
}

function upperBound(bars: readonly MarketBar[], to: string): number {
  let low = 0;
  let high = bars.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (bars[mid]!.timestamp <= to) low = mid + 1;
    else high = mid;
  }
  return low;
}
