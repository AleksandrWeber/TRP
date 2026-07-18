import { performance } from 'node:perf_hooks';
import { Timeframe } from '../../modules/market-data/timeframe';
import { mapBinanceKlineMessageToDraft } from '../../modules/live-market-data/connectors/binance/map-binance-kline-message';
import { normalizeClosedCandle } from '../../modules/live-market-data/normalization/normalize-closed-candle';
import { MarketStreamIntegrityController } from '../../modules/live-market-data/integrity/market-stream-integrity-controller';
import { InMemoryInboxRepository } from '../../modules/event-processing/repositories/in-memory-inbox.repository';
import { InMemoryConsumerCheckpointRepository } from '../../modules/event-processing/repositories/in-memory-consumer-checkpoint.repository';
import { InMemoryMarketCheckpointPersistence } from '../../modules/live-market-data/checkpoints/in-memory-market-checkpoint.persistence';
import { MarketCheckpointStore } from '../../modules/live-market-data/checkpoints/market-checkpoint-store';
import { LatestMarketStateProjection } from '../../modules/live-market-data/projection/latest-market-state-projection';
import { MarketProjectionBroadcaster } from '../../modules/live-market-data/api/market-projection-broadcaster';
import { MarketHealthStatus } from '../../modules/live-market-data/domain/market-status';
import { FIXTURE_VALID_KLINE, FIXTURE_NOW_MS } from './fixtures/binance-recorded-fixtures';

export type M1WorkloadSize = 'small' | 'medium' | 'practical_limit';

export type M1BaselineResult = Readonly<{
  size: M1WorkloadSize;
  events: number;
  accepted: number;
  duplicates: number;
  durationMs: number;
  eventsPerSec: number;
  heapUsedMbStart: number;
  heapUsedMbEnd: number;
  heapDeltaMb: number;
  fanOutDelivered: number;
  fanOutDropped: number;
}>;

const WORKLOAD: Record<M1WorkloadSize, number> = {
  small: 100,
  medium: 1_000,
  practical_limit: 5_000,
};

/**
 * M1 performance baseline runner (US152).
 * Synthetic closed-candle stream through integrity → projection → SSE fan-out.
 */
export async function runM1PerformanceBaseline(size: M1WorkloadSize): Promise<M1BaselineResult> {
  const events = WORKLOAD[size];
  const integrity = new MarketStreamIntegrityController();
  const inbox = new InMemoryInboxRepository();
  const consumerCheckpoints = new InMemoryConsumerCheckpointRepository();
  const marketCheckpoints = new MarketCheckpointStore(new InMemoryMarketCheckpointPersistence());
  const broadcaster = new MarketProjectionBroadcaster();
  const projection = new LatestMarketStateProjection(
    inbox,
    consumerCheckpoints,
    marketCheckpoints,
    broadcaster,
  );

  const sub = broadcaster.subscribe({
    workspaceId: 'ws-m1-perf',
    maxBuffered: 32,
  });

  const heapStart = process.memoryUsage().heapUsed / (1024 * 1024);
  const started = performance.now();
  let accepted = 0;
  let duplicates = 0;

  const openBase = Date.parse('2026-07-01T00:00:00.000Z');
  for (let i = 1; i <= events; i += 1) {
    const openMs = openBase + (i - 1) * 3_600_000;
    const closeMs = openMs + 3_599_999;
    const nowMs = closeMs + 1;
    const draft = mapBinanceKlineMessageToDraft({
      workspaceId: 'ws-m1-perf',
      timeframe: Timeframe.H1,
      sequence: i,
      nowMs,
      message: {
        ...FIXTURE_VALID_KLINE,
        E: nowMs,
        k: {
          ...FIXTURE_VALID_KLINE.k!,
          t: openMs,
          T: closeMs,
          o: String(100 + i),
          h: String(110 + i),
          l: String(95 + i),
          c: String(105 + i),
          v: String(i),
          x: true,
        },
      },
      receivedAt: new Date(nowMs).toISOString(),
      processedAt: new Date(nowMs + 1).toISOString(),
      recordedAt: new Date(nowMs + 2).toISOString(),
    });
    const normalized = normalizeClosedCandle(draft);
    if (!normalized.ok) continue;
    const admit = integrity.admit(normalized.event, normalized.event.recordedAt);
    if (admit.outcome === 'accepted') {
      accepted += 1;
      await projection.apply(normalized.event, normalized.event.processedAt);
      await marketCheckpoints.advance({
        event: normalized.event,
        health: MarketHealthStatus.HEALTHY,
        updatedAt: normalized.event.recordedAt,
        eventDurablyRecorded: true,
      });
    } else if (admit.outcome === 'duplicate') {
      duplicates += 1;
    }

    // Inject a duplicate every 50 events to exercise dedup under load.
    if (i % 50 === 0) {
      const again = integrity.admit(normalized.event, normalized.event.recordedAt);
      if (again.outcome === 'duplicate') duplicates += 1;
    }
  }

  // Drain fan-out buffer
  let delivered = 0;
  while (sub.next() !== null) {
    delivered += 1;
  }
  const dropped = sub.droppedCount();
  sub.close();

  const durationMs = performance.now() - started;
  const heapEnd = process.memoryUsage().heapUsed / (1024 * 1024);

  return Object.freeze({
    size,
    events,
    accepted,
    duplicates,
    durationMs,
    eventsPerSec: accepted / (durationMs / 1000),
    heapUsedMbStart: heapStart,
    heapUsedMbEnd: heapEnd,
    heapDeltaMb: heapEnd - heapStart,
    fanOutDelivered: delivered,
    fanOutDropped: dropped,
  });
}

/** Documented practical limits for M1 exit (US152). */
export const M1_BASELINE_LIMITS = Object.freeze({
  /** Medium workload should finish under 15s on CI-class hardware. */
  mediumMaxDurationMs: 15_000,
  /** Practical-limit heap growth must stay under 256 MB for this synthetic path. */
  practicalMaxHeapDeltaMb: 256,
  /** Sustained throughput floor for medium workload. */
  mediumMinEventsPerSec: 50,
});

void FIXTURE_NOW_MS;
