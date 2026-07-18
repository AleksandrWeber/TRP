/**
 * US150 — Recorded stream deterministic replay validation.
 */
import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../modules/market-data/timeframe';
import { mapBinanceKlineMessageToDraft } from '../../modules/live-market-data/connectors/binance/map-binance-kline-message';
import { mapBinanceBookTickerToDraft } from '../../modules/live-market-data/connectors/binance/map-binance-book-ticker';
import {
  closedCandlesAreSemanticallyEqual,
  normalizeClosedCandle,
} from '../../modules/live-market-data/normalization/normalize-closed-candle';
import { normalizeMarkPrice } from '../../modules/live-market-data/normalization/normalize-mark-price';
import { MarketStreamIntegrityController } from '../../modules/live-market-data/integrity/market-stream-integrity-controller';
import { InMemoryInboxRepository } from '../../modules/event-processing/repositories/in-memory-inbox.repository';
import { InMemoryConsumerCheckpointRepository } from '../../modules/event-processing/repositories/in-memory-consumer-checkpoint.repository';
import { InMemoryMarketCheckpointPersistence } from '../../modules/live-market-data/checkpoints/in-memory-market-checkpoint.persistence';
import { MarketCheckpointStore } from '../../modules/live-market-data/checkpoints/market-checkpoint-store';
import { LatestMarketStateProjection } from '../../modules/live-market-data/projection/latest-market-state-projection';
import { MarketHealthStatus } from '../../modules/live-market-data/domain/market-status';
import {
  isClosedCandleEvent,
  type MarketEvent,
} from '../../modules/live-market-data/domain/market-event';
import { buildMarketEventSemanticIdentity } from '../../modules/live-market-data/domain/market-event-identity';
import {
  FIXTURE_NOW_MS,
  RECORDED_STREAM_SEQUENCE,
  type FixtureBookTicker,
  type FixtureKline,
} from './fixtures/binance-recorded-fixtures';

type SemanticSnapshot = Readonly<{
  candles: ReadonlyArray<string>;
  marks: ReadonlyArray<string>;
  identities: ReadonlyArray<string>;
  candleCheckpointSequence: number | null;
  candleLastClose: number | null;
  acceptedCandleCount: number;
}>;

async function replayOnce(opsOffsetMs: number): Promise<SemanticSnapshot> {
  const integrity = new MarketStreamIntegrityController();
  const inbox = new InMemoryInboxRepository();
  const consumerCheckpoints = new InMemoryConsumerCheckpointRepository();
  const marketCheckpoints = new MarketCheckpointStore(new InMemoryMarketCheckpointPersistence());
  const projection = new LatestMarketStateProjection(inbox, consumerCheckpoints, marketCheckpoints);

  const candles: string[] = [];
  const marks: string[] = [];
  const identities: string[] = [];
  const acceptedCandles: MarketEvent[] = [];
  let candleStreamId: string | null = null;

  for (const step of RECORDED_STREAM_SEQUENCE) {
    const receivedAt = new Date(FIXTURE_NOW_MS + opsOffsetMs + step.sequence).toISOString();
    const processedAt = new Date(FIXTURE_NOW_MS + opsOffsetMs + step.sequence + 10).toISOString();
    const recordedAt = new Date(FIXTURE_NOW_MS + opsOffsetMs + step.sequence + 20).toISOString();

    if (step.kind === 'kline') {
      const draft = mapBinanceKlineMessageToDraft({
        workspaceId: 'ws-us150',
        timeframe: Timeframe.H1,
        sequence: step.sequence,
        nowMs: step.nowMs,
        message: step.message as FixtureKline,
        receivedAt,
        processedAt,
        recordedAt,
      });
      const normalized = normalizeClosedCandle(draft);
      if (!normalized.ok) continue;
      const admit = integrity.admit(normalized.event, recordedAt);
      if (admit.outcome === 'accepted') {
        candleStreamId = String(normalized.event.streamId);
        acceptedCandles.push(normalized.event);
        candles.push(
          `${normalized.event.openTime}|${normalized.event.close}|${normalized.event.sequence}`,
        );
        identities.push(buildMarketEventSemanticIdentity(normalized.event));
        await projection.apply(normalized.event, processedAt);
        await marketCheckpoints.advance({
          event: normalized.event,
          health: MarketHealthStatus.HEALTHY,
          updatedAt: recordedAt,
          eventDurablyRecorded: true,
        });
      }
    } else {
      const draft = mapBinanceBookTickerToDraft({
        workspaceId: 'ws-us150',
        sequence: step.sequence,
        message: step.message as FixtureBookTicker,
        // Domain exchange time is fixed — operational clocks may differ (ADR-018).
        exchangeOccurredAt: '2026-07-18T10:00:00.500Z',
        receivedAt,
        processedAt,
        recordedAt,
      });
      const normalized = normalizeMarkPrice(draft);
      if (!normalized.ok || !normalized.published) continue;
      const admit = integrity.admit(normalized.event, recordedAt);
      if (admit.outcome === 'accepted') {
        marks.push(`${normalized.event.price}|${normalized.event.sequence}`);
        identities.push(buildMarketEventSemanticIdentity(normalized.event));
        await projection.apply(normalized.event, processedAt);
      }
    }
  }

  const checkpoint =
    candleStreamId !== null ? await marketCheckpoints.get('ws-us150', candleStreamId) : null;
  const latest = candleStreamId !== null ? projection.get('ws-us150', candleStreamId) : null;

  if (candleStreamId !== null && latest !== null) {
    const rebuilt = await projection.rebuild({
      workspaceId: 'ws-us150',
      streamId: candleStreamId,
      events: acceptedCandles.filter(isClosedCandleEvent),
      checkpoint,
      rebuiltAt: '2026-07-18T12:00:00.000Z',
    });
    expect(rebuilt?.latestClosedCandle?.close ?? null).toBe(
      latest.latestClosedCandle?.close ?? null,
    );
    expect(rebuilt?.projectionVersion).toBe(latest.projectionVersion);
  }

  return Object.freeze({
    candles: Object.freeze([...candles]),
    marks: Object.freeze([...marks]),
    identities: Object.freeze([...identities]),
    candleCheckpointSequence: checkpoint?.lastSequence ?? null,
    candleLastClose: latest?.latestClosedCandle?.close ?? null,
    acceptedCandleCount: acceptedCandles.length,
  });
}

describe('US150 — Recorded stream determinism', () => {
  it('replays identical semantic candles, marks, identities, and checkpoints across runs', async () => {
    const a = await replayOnce(0);
    const b = await replayOnce(5_000);
    expect(a.candles).toEqual(b.candles);
    expect(a.marks).toEqual(b.marks);
    expect(a.identities).toEqual(b.identities);
    expect(a.candleCheckpointSequence).toBe(b.candleCheckpointSequence);
    expect(a.candleLastClose).toBe(b.candleLastClose);
    expect(a.acceptedCandleCount).toBeGreaterThanOrEqual(2);
  });

  it('duplicate and overlap handling yields one semantic effect per candle identity', async () => {
    const snap = await replayOnce(0);
    expect(snap.acceptedCandleCount).toBe(snap.candles.length);
    expect(new Set(snap.identities.filter((_, i) => i < snap.candles.length)).size).toBe(
      snap.candles.length,
    );
  });

  it('operational timestamps may differ without changing semantic equality', () => {
    const draftA = mapBinanceKlineMessageToDraft({
      workspaceId: 'ws-us150',
      timeframe: Timeframe.H1,
      sequence: 1,
      nowMs: FIXTURE_NOW_MS,
      message: RECORDED_STREAM_SEQUENCE[0]!.message as FixtureKline,
      receivedAt: '2026-07-18T10:00:00.010Z',
      processedAt: '2026-07-18T10:00:00.020Z',
      recordedAt: '2026-07-18T10:00:00.030Z',
    });
    const draftB = mapBinanceKlineMessageToDraft({
      workspaceId: 'ws-us150',
      timeframe: Timeframe.H1,
      sequence: 1,
      nowMs: FIXTURE_NOW_MS,
      message: RECORDED_STREAM_SEQUENCE[0]!.message as FixtureKline,
      receivedAt: '2026-07-18T11:00:00.010Z',
      processedAt: '2026-07-18T11:00:00.520Z',
      recordedAt: '2026-07-18T11:00:00.900Z',
    });
    const a = normalizeClosedCandle(draftA);
    const b = normalizeClosedCandle(draftB);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(closedCandlesAreSemanticallyEqual(a.event, b.event)).toBe(true);
    expect(a.event.receivedAt).not.toBe(b.event.receivedAt);
  });
});
