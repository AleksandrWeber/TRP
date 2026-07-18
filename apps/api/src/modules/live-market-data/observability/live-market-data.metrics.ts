/**
 * Live market-data metric names (US145).
 * Labels must stay bounded — never attach raw instrument/event ids.
 */
export const LiveMarketMetricNames = {
  eventsTotal: 'live_market_events_total',
  eventLagMs: 'live_market_event_lag_ms',
  duplicatesTotal: 'live_market_duplicates_total',
  invalidsTotal: 'live_market_invalids_total',
  gapsTotal: 'live_market_gaps_total',
  reconnectsTotal: 'live_market_reconnects_total',
  backfillBarsTotal: 'live_market_backfill_bars_total',
  outboxOldestAgeMs: 'live_market_outbox_oldest_age_ms',
  consumerLag: 'live_market_consumer_lag',
  deadLettersTotal: 'live_market_dead_letters_total',
  streamHealth: 'live_market_stream_health',
} as const;

/**
 * Bounded label keys allowed on live-market metrics (US145).
 * Cardinality is limited to source + channel + outcome/status families.
 */
export const LIVE_MARKET_ALLOWED_LABEL_KEYS = Object.freeze([
  'sourceId',
  'channel',
  'outcome',
  'status',
  'consumerId',
] as const);

export type LiveMarketMetricLabels = Partial<
  Record<(typeof LIVE_MARKET_ALLOWED_LABEL_KEYS)[number], string>
>;

export type LiveMarketMetricsSnapshot = Readonly<{
  eventsTotal: number;
  duplicatesTotal: number;
  invalidsTotal: number;
  gapsTotal: number;
  reconnectsTotal: number;
  backfillBarsTotal: number;
  deadLettersTotal: number;
  lastEventLagMs: number | null;
  outboxOldestAgeMs: number | null;
  consumerLag: number | null;
}>;

/**
 * In-process live market-data metrics (US145).
 * Observability only — never influences candle/price semantics.
 */
export class LiveMarketDataMetrics {
  private eventsTotal = 0;
  private duplicatesTotal = 0;
  private invalidsTotal = 0;
  private gapsTotal = 0;
  private reconnectsTotal = 0;
  private backfillBarsTotal = 0;
  private deadLettersTotal = 0;
  private lastEventLagMs: number | null = null;
  private outboxOldestAgeMs: number | null = null;
  private consumerLag: number | null = null;

  recordEvent(labels?: LiveMarketMetricLabels): void {
    assertBoundedLabels(labels);
    this.eventsTotal += 1;
  }

  recordEventLagMs(lagMs: number, labels?: LiveMarketMetricLabels): void {
    assertBoundedLabels(labels);
    this.lastEventLagMs = lagMs;
  }

  recordDuplicate(labels?: LiveMarketMetricLabels): void {
    assertBoundedLabels(labels);
    this.duplicatesTotal += 1;
  }

  recordInvalid(labels?: LiveMarketMetricLabels): void {
    assertBoundedLabels(labels);
    this.invalidsTotal += 1;
  }

  recordGap(labels?: LiveMarketMetricLabels): void {
    assertBoundedLabels(labels);
    this.gapsTotal += 1;
  }

  recordReconnect(labels?: LiveMarketMetricLabels): void {
    assertBoundedLabels(labels);
    this.reconnectsTotal += 1;
  }

  recordBackfillBars(count: number, labels?: LiveMarketMetricLabels): void {
    assertBoundedLabels(labels);
    this.backfillBarsTotal += count;
  }

  setOutboxOldestAgeMs(ageMs: number): void {
    this.outboxOldestAgeMs = ageMs;
  }

  setConsumerLag(lag: number, labels?: LiveMarketMetricLabels): void {
    assertBoundedLabels(labels);
    this.consumerLag = lag;
  }

  recordDeadLetter(labels?: LiveMarketMetricLabels): void {
    assertBoundedLabels(labels);
    this.deadLettersTotal += 1;
  }

  snapshot(): LiveMarketMetricsSnapshot {
    return Object.freeze({
      eventsTotal: this.eventsTotal,
      duplicatesTotal: this.duplicatesTotal,
      invalidsTotal: this.invalidsTotal,
      gapsTotal: this.gapsTotal,
      reconnectsTotal: this.reconnectsTotal,
      backfillBarsTotal: this.backfillBarsTotal,
      deadLettersTotal: this.deadLettersTotal,
      lastEventLagMs: this.lastEventLagMs,
      outboxOldestAgeMs: this.outboxOldestAgeMs,
      consumerLag: this.consumerLag,
    });
  }
}

export function assertBoundedLabels(labels?: LiveMarketMetricLabels): void {
  if (!labels) return;
  for (const key of Object.keys(labels)) {
    if (!(LIVE_MARKET_ALLOWED_LABEL_KEYS as readonly string[]).includes(key)) {
      throw new Error(`unbounded or forbidden live-market metric label: ${key}`);
    }
  }
}
