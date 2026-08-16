import { describe, expect, it, vi } from 'vitest';
import { toDurableEventId, type DurableEventEnvelope } from '../event-processing';
import { LiveMarketConnectorRegistry } from '../live-market-data/ports/live-market-connector-registry';
import { InMemoryMarketSubscriptionPersistence } from '../live-market-data/subscriptions/in-memory-market-subscription.persistence';
import { MarketSubscriptionRegistry } from '../live-market-data/subscriptions/market-subscription-registry';
import { TradingSessionRuntimeWorker } from './trading-session-runtime.worker';

function envelope(
  overrides: Partial<DurableEventEnvelope> & Pick<DurableEventEnvelope, 'eventType'>,
): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId('evt-1'),
    schemaVersion: 1,
    aggregateType: 'MarketStream',
    aggregateId: 'stream-1',
    aggregateVersion: 1,
    workspaceId: 'ws-1',
    occurredAt: '2026-07-29T18:19:59.999Z',
    recordedAt: '2026-07-29T18:20:02.000Z',
    payload: Object.freeze({
      instrument: 'BTCUSDT',
      timeframe: '1m',
      openTime: '2026-07-29T18:19:00.000Z',
      closeTime: '2026-07-29T18:19:59.999Z',
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 12,
    }),
    ...overrides,
  });
}

describe('TradingSessionRuntimeWorker', () => {
  it('invokes the existing pipeline for a closed candle and does not poll', async () => {
    const pipeline = { run: vi.fn(async () => ({ outcome: 'filled', order: { id: 'ord-1' } })) };
    const session = {
      id: 'session-1',
      workspaceId: 'ws-1',
      paperAccountId: 'acct-1',
      deploymentId: 'dep-1',
      origin: 'strategy',
      status: 'running',
      lease: {
        ownerId: 'worker-1',
        fencingToken: 1,
        acquiredAt: '2026-07-29T18:20:01.000Z',
        expiresAt: '2026-07-29T18:21:01.000Z',
        heartbeatAt: '2026-07-29T18:20:01.000Z',
      },
      actorId: 'trader-1',
    };
    const deployment = {
      id: 'dep-1',
      instrument: 'BTCUSDT',
      timeframe: '1m',
      parameters: { action: 'buy' },
    };
    const assembler = {
      listArmedStrategySessions: vi.fn(async () => [session]),
      loadDeployment: vi.fn(async () => deployment),
      candleMatchesDeployment: vi.fn(() => true),
      canEvaluate: vi.fn(async () => true),
      assemble: vi.fn(async () => ({ sessionId: 'session-1' })),
    };
    const narratives = { requestAndNarrate: vi.fn(() => ({ report: { outcome: 'empty' } })) };
    const notifications = { requestAndDeliver: vi.fn(() => ({ projection: { invoked: true } })) };
    const dispatcher = { register: vi.fn() };
    const worker = new TradingSessionRuntimeWorker(
      dispatcher as never,
      assembler as never,
      pipeline as never,
      new MarketSubscriptionRegistry(new InMemoryMarketSubscriptionPersistence()),
      new LiveMarketConnectorRegistry(),
      narratives as never,
      notifications as never,
    );

    worker.onModuleInit();
    await worker.handle(envelope({ eventType: 'MarketClosedCandle' }));

    expect(dispatcher.register).toHaveBeenCalledWith(
      expect.objectContaining({ consumerId: 'v2-trading-session-runtime' }),
    );
    expect(pipeline.run).toHaveBeenCalledTimes(1);
    expect(narratives.requestAndNarrate).toHaveBeenCalledTimes(1);
    expect(notifications.requestAndDeliver).toHaveBeenCalledTimes(1);
  });
});
