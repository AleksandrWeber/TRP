import { describe, expect, it } from 'vitest';
import { toInstrument } from '../../market-data/instrument';
import { Timeframe } from '../../market-data/timeframe';
import { createClosedCandleEvent } from '../domain/closed-candle-event';
import { MarketHealthStatus } from '../domain/market-status';
import { MarketStreamChannel } from '../domain/market-stream-channel';
import { InMemoryMarketCheckpointPersistence } from '../checkpoints/in-memory-market-checkpoint.persistence';
import { MarketCheckpointStore } from '../checkpoints/market-checkpoint-store';
import { MarketStreamIntegrityController } from '../integrity/market-stream-integrity-controller';
import { MarketDataValidator } from '../normalization/market-data-validator';
import type { ClosedCandleBackfillBar } from '../ports/live-market-connector';
import { FakeLiveMarketConnector } from '../ports/fake-live-market-connector';
import { InMemoryMarketSubscriptionPersistence } from '../subscriptions/in-memory-market-subscription.persistence';
import { MarketSubscriptionRegistry } from '../subscriptions/market-subscription-registry';
import { StartupRecoveryService } from './startup-recovery.service';

function bar(openTime: string, close = 101): ClosedCandleBackfillBar {
  const openMs = Date.parse(openTime);
  return Object.freeze({
    instrument: toInstrument('BTCUSDT'),
    timeframe: Timeframe.M1,
    openTime,
    closeTime: new Date(openMs + 59_999).toISOString(),
    open: 100,
    high: 110,
    low: 90,
    close,
    volume: 1,
    exchangeOccurredAt: openTime,
  });
}

function candle(sequence: number, openTime: string) {
  const openMs = Date.parse(openTime);
  return createClosedCandleEvent({
    workspaceId: 'ws-1',
    sourceId: 'fake_public',
    instrument: 'BTCUSDT',
    timeframe: Timeframe.M1,
    sequence,
    openTime,
    closeTime: new Date(openMs + 59_999).toISOString(),
    open: 100,
    high: 110,
    low: 90,
    close: 100 + sequence,
    volume: 1,
    exchangeOccurredAt: openTime,
    occurredAt: openTime,
    receivedAt: '2026-07-18T12:00:01.000Z',
    processedAt: '2026-07-18T12:00:02.000Z',
    recordedAt: '2026-07-18T12:00:03.000Z',
  });
}

async function seedDurableState(options: {
  lastSequence: number;
  lastOpen: string;
  backfillBars?: ClosedCandleBackfillBar[];
  now: string;
}) {
  const subPersistence = new InMemoryMarketSubscriptionPersistence();
  const registry = new MarketSubscriptionRegistry(subPersistence);
  await registry.subscribe(
    {
      workspaceId: 'ws-1',
      sourceId: 'fake_public',
      instrument: 'BTCUSDT',
      channel: MarketStreamChannel.CLOSED_CANDLE,
      timeframe: Timeframe.M1,
    },
    '2026-07-18T11:00:00.000Z',
  );

  const cpPersistence = new InMemoryMarketCheckpointPersistence();
  const checkpoints = new MarketCheckpointStore(cpPersistence);
  const event = candle(options.lastSequence, options.lastOpen);
  await checkpoints.advance({
    event,
    health: MarketHealthStatus.HEALTHY,
    updatedAt: options.lastOpen,
    eventDurablyRecorded: true,
  });

  // Simulate process death: new registry over same durable rows, empty integrity.
  const restartedRegistry = new MarketSubscriptionRegistry(subPersistence.clone());
  const restartedCheckpoints = new MarketCheckpointStore(cpPersistence.clone());
  const integrity = new MarketStreamIntegrityController();
  const connector = new FakeLiveMarketConnector({
    sourceId: 'fake_public',
    backfillBars: options.backfillBars ?? [],
  });
  let gapComplete = false;
  const connectorWithGap = Object.assign(connector, {
    markGapRecoveryComplete: () => {
      gapComplete = true;
    },
  });

  const recovery = new StartupRecoveryService({
    subscriptions: restartedRegistry,
    checkpoints: restartedCheckpoints,
    integrity,
    validator: new MarketDataValidator(),
    connector: connectorWithGap,
    now: () => options.now,
  });

  return { recovery, restartedRegistry, integrity, gapComplete: () => gapComplete, event };
}

describe('US142 — StartupRecoveryService', () => {
  it('starts from durable subscriptions/checkpoints, not process memory', async () => {
    const { recovery, restartedRegistry } = await seedDurableState({
      lastSequence: 1,
      lastOpen: '2026-07-18T12:00:00.000Z',
      now: '2026-07-18T12:01:00.000Z',
    });

    // Fresh registry has empty in-memory map until hydrate.
    expect(restartedRegistry.isHydrated()).toBe(false);
    expect(restartedRegistry.list('ws-1')).toHaveLength(0);

    const result = await recovery.recover();

    expect(restartedRegistry.isHydrated()).toBe(true);
    expect(result.restoredSubscriptions).toBe(1);
    expect(result.reports[0]?.checkpointSequence).toBe(1);
  });

  it('restores subscriptions idempotently', async () => {
    const { recovery, restartedRegistry } = await seedDurableState({
      lastSequence: 1,
      lastOpen: '2026-07-18T12:00:00.000Z',
      now: '2026-07-18T12:01:00.000Z',
    });

    await recovery.recover();
    const first = restartedRegistry.list('ws-1');
    await recovery.recover();
    const second = restartedRegistry.list('ws-1');

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(String(first[0]?.id)).toBe(String(second[0]?.id));
  });

  it('triggers recovery for elapsed missing intervals', async () => {
    const { recovery } = await seedDurableState({
      lastSequence: 1,
      lastOpen: '2026-07-18T12:00:00.000Z',
      now: '2026-07-18T12:03:00.000Z',
      backfillBars: [bar('2026-07-18T12:01:00.000Z', 102), bar('2026-07-18T12:02:00.000Z', 103)],
    });

    const result = await recovery.recover();

    expect(result.reports[0]?.gapTriggered).toBe(true);
    expect(result.reports[0]?.gapClosed).toBe(true);
    expect(result.reports[0]?.liveEnabled).toBe(true);
    expect(result.allHealthy).toBe(true);
  });

  it('buffers live events until ordering is safe, then drains', async () => {
    const { recovery, integrity } = await seedDurableState({
      lastSequence: 1,
      lastOpen: '2026-07-18T12:00:00.000Z',
      now: '2026-07-18T12:02:00.000Z',
      backfillBars: [bar('2026-07-18T12:01:00.000Z', 102)],
    });

    const streamId = String(candle(1, '2026-07-18T12:00:00.000Z').streamId);
    const live = candle(3, '2026-07-18T12:02:00.000Z');
    expect(recovery.offerLiveEvent(live)).toBe('buffered');
    expect(recovery.getBuffer().size(streamId)).toBe(1);

    const result = await recovery.recover();

    expect(result.reports[0]?.bufferedDrained).toBe(1);
    expect(integrity.getState(streamId)?.lastAppliedSequence).toBe(3);
    expect(recovery.offerLiveEvent(candle(4, '2026-07-18T12:03:00.000Z'))).toBe('live');
  });

  it('becomes healthy only after checkpoint reconciliation', async () => {
    const { recovery, gapComplete } = await seedDurableState({
      lastSequence: 1,
      lastOpen: '2026-07-18T12:00:00.000Z',
      now: '2026-07-18T12:03:00.000Z',
      // Incomplete backfill — one of two missing bars.
      backfillBars: [bar('2026-07-18T12:01:00.000Z', 102)],
    });

    const result = await recovery.recover();

    expect(result.reports[0]?.gapTriggered).toBe(true);
    expect(result.reports[0]?.gapClosed).toBe(false);
    expect(result.reports[0]?.liveEnabled).toBe(false);
    expect(result.reports[0]?.health).toBe(MarketHealthStatus.DEGRADED);
    expect(result.allHealthy).toBe(false);
    expect(gapComplete()).toBe(false);
  });
});
