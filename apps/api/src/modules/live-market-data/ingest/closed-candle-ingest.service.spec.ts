import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../market-data/timeframe';
import { InMemoryConsumerCheckpointRepository } from '../../event-processing/repositories/in-memory-consumer-checkpoint.repository';
import { InMemoryInboxRepository } from '../../event-processing/repositories/in-memory-inbox.repository';
import { InMemoryOutboxRepository } from '../../event-processing/repositories/in-memory-outbox.repository';
import { InMemoryTransactionalOutboxWriter } from '../../event-processing/repositories/in-memory-transactional-outbox.writer';
import { createClosedCandleEvent } from '../domain/closed-candle-event';
import { MarketStreamChannel } from '../domain/market-stream-channel';
import { InMemoryMarketCheckpointPersistence } from '../checkpoints/in-memory-market-checkpoint.persistence';
import { MarketCheckpointStore } from '../checkpoints/market-checkpoint-store';
import { MarketStreamIntegrityController } from '../integrity/market-stream-integrity-controller';
import { MarketDataValidator } from '../normalization/market-data-validator';
import { LatestMarketStateProjection } from '../projection/latest-market-state-projection';
import { ClosedCandleIngestService } from './closed-candle-ingest.service';

const TIMESTAMPS = {
  exchangeOccurredAt: '2026-07-29T18:19:00.000Z',
  occurredAt: '2026-07-29T18:19:00.000Z',
  receivedAt: '2026-07-29T18:20:00.000Z',
  processedAt: '2026-07-29T18:20:00.000Z',
  recordedAt: '2026-07-29T18:20:00.000Z',
} as const;

function ingestService() {
  const outbox = new InMemoryOutboxRepository();
  const writer = new InMemoryTransactionalOutboxWriter(outbox);
  const projection = new LatestMarketStateProjection(
    new InMemoryInboxRepository(),
    new InMemoryConsumerCheckpointRepository(),
    new MarketCheckpointStore(new InMemoryMarketCheckpointPersistence()),
    null,
  );
  const service = new ClosedCandleIngestService(
    new MarketDataValidator(),
    new MarketStreamIntegrityController(),
    writer,
    projection,
    new MarketCheckpointStore(new InMemoryMarketCheckpointPersistence()),
  );
  return { service, outbox, projection };
}

describe('ClosedCandleIngestService', () => {
  it('publishes a normalized closed candle onto the market outbox', async () => {
    const { service, outbox, projection } = ingestService();
    const event = createClosedCandleEvent({
      eventId: 'market-event-ingest-1',
      workspaceId: 'ws-ingest',
      sourceId: 'binance_spot',
      instrument: 'BTCUSDT',
      sequence: 1,
      timeframe: Timeframe.M1,
      openTime: '2026-07-29T18:19:00.000Z',
      closeTime: '2026-07-29T18:19:59.999Z',
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 12,
      ...TIMESTAMPS,
    });

    const result = await service.publish(event);

    expect(result.outcome).toBe('published');
    expect(await outbox.findByEventId(event.eventId)).not.toBeNull();
    expect(projection.get('ws-ingest', String(event.streamId))?.latestClosedCandle?.close).toBe(
      105,
    );
    expect(event.channel).toBe(MarketStreamChannel.CLOSED_CANDLE);
  });

  it('does not republish a duplicate closed candle', async () => {
    const { service, outbox } = ingestService();
    const event = createClosedCandleEvent({
      eventId: 'market-event-ingest-dup',
      workspaceId: 'ws-ingest',
      sourceId: 'binance_spot',
      instrument: 'ETHUSDT',
      sequence: 1,
      timeframe: Timeframe.M1,
      openTime: '2026-07-29T18:19:00.000Z',
      closeTime: '2026-07-29T18:19:59.999Z',
      open: 10,
      high: 11,
      low: 9,
      close: 10.5,
      volume: 1,
      ...TIMESTAMPS,
    });

    expect((await service.publish(event)).outcome).toBe('published');
    expect((await service.publish(event)).outcome).toBe('duplicate');
    expect(await outbox.findByEventId(event.eventId)).not.toBeNull();
  });
});
