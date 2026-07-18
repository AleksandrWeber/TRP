import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../market-data/timeframe';
import { MarketStreamChannel } from '../domain/market-stream-channel';
import { MarketSubscriptionState } from '../domain/market-subscription';
import { InMemoryMarketSubscriptionPersistence } from './in-memory-market-subscription.persistence';
import {
  MarketSubscriptionRegistry,
  subscriptionIdFor,
  type MarketSubscribeCommand,
} from './market-subscription-registry';

const CANDLE_CMD: MarketSubscribeCommand = {
  workspaceId: 'ws-1',
  sourceId: 'binance_spot',
  instrument: 'BTCUSDT',
  channel: MarketStreamChannel.CLOSED_CANDLE,
  timeframe: Timeframe.H1,
};

const AT = '2026-07-18T12:00:00.000Z';

describe('US140 — MarketSubscriptionRegistry', () => {
  it('creates a stable workspace-scoped subscription identity', async () => {
    const registry = new MarketSubscriptionRegistry(new InMemoryMarketSubscriptionPersistence());
    const created = await registry.subscribe(CANDLE_CMD, AT);

    expect(String(created.id)).toBe(subscriptionIdFor(CANDLE_CMD));
    expect(String(created.id)).toContain('ws-1');
    expect(created.state).toBe(MarketSubscriptionState.DESIRED);
    expect(created.workspaceId).toBe('ws-1');
  });

  it('treats duplicate subscription commands as idempotent', async () => {
    const registry = new MarketSubscriptionRegistry(new InMemoryMarketSubscriptionPersistence());
    const first = await registry.subscribe(CANDLE_CMD, AT);
    await registry.markActive('ws-1', String(first.id), '2026-07-18T12:01:00.000Z');

    const repeat = await registry.subscribe(CANDLE_CMD, '2026-07-18T12:02:00.000Z');

    expect(String(repeat.id)).toBe(String(first.id));
    expect(repeat.state).toBe(MarketSubscriptionState.ACTIVE);
    expect(registry.list('ws-1')).toHaveLength(1);
  });

  it('isolates workspaces from each other', async () => {
    const registry = new MarketSubscriptionRegistry(new InMemoryMarketSubscriptionPersistence());
    const mine = await registry.subscribe(CANDLE_CMD, AT);
    await registry.subscribe({ ...CANDLE_CMD, workspaceId: 'ws-2' }, AT);

    expect(registry.list('ws-1')).toHaveLength(1);
    expect(registry.list('ws-2')).toHaveLength(1);
    expect(registry.get('ws-2', String(mine.id))).toBeNull();
    expect(await registry.unsubscribe('ws-2', String(mine.id), AT)).toBeNull();
  });

  it('keeps desired state across connector replacement', async () => {
    const registry = new MarketSubscriptionRegistry(new InMemoryMarketSubscriptionPersistence());
    const sub = await registry.subscribe(CANDLE_CMD, AT);
    await registry.markActive('ws-1', String(sub.id), '2026-07-18T12:01:00.000Z');

    await registry.markDesiredForSource('binance_spot', '2026-07-18T12:05:00.000Z');

    const desired = registry.desiredFor('binance_spot');
    expect(desired).toHaveLength(1);
    expect(desired[0]?.state).toBe(MarketSubscriptionState.DESIRED);
    expect(String(desired[0]?.id)).toBe(String(sub.id));
  });

  it('stops idempotently and excludes stopped from desired set', async () => {
    const registry = new MarketSubscriptionRegistry(new InMemoryMarketSubscriptionPersistence());
    const sub = await registry.subscribe(CANDLE_CMD, AT);

    const stopped = await registry.unsubscribe('ws-1', String(sub.id), '2026-07-18T12:03:00.000Z');
    const again = await registry.unsubscribe('ws-1', String(sub.id), '2026-07-18T12:04:00.000Z');

    expect(stopped?.state).toBe(MarketSubscriptionState.STOPPED);
    expect(again?.state).toBe(MarketSubscriptionState.STOPPED);
    expect(again?.updatedAt).toBe('2026-07-18T12:03:00.000Z');
    expect(registry.desiredFor('binance_spot')).toHaveLength(0);
  });

  it('persists desired state across process restart (hydrate)', async () => {
    const persistence = new InMemoryMarketSubscriptionPersistence();
    const first = new MarketSubscriptionRegistry(persistence);
    await first.subscribe(CANDLE_CMD, AT);

    const restarted = new MarketSubscriptionRegistry(persistence.clone());
    expect(restarted.list('ws-1')).toHaveLength(0);
    await restarted.hydrate();
    expect(restarted.list('ws-1')).toHaveLength(1);
    expect(restarted.desiredFor('binance_spot')[0]?.state).toBe(MarketSubscriptionState.DESIRED);
  });

  it('contains no Trading Session behavior', () => {
    const registry = new MarketSubscriptionRegistry(
      new InMemoryMarketSubscriptionPersistence(),
    ) as unknown as Record<string, unknown>;
    const memberNames = [
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(registry)),
      ...Object.keys(registry),
    ].map((name) => name.toLowerCase());
    for (const forbidden of ['session', 'order', 'risk', 'signal', 'position']) {
      expect(memberNames.some((name) => name.includes(forbidden))).toBe(false);
    }
  });
});
