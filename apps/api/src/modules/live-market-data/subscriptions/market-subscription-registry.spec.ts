import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../market-data/timeframe';
import { MarketStreamChannel } from '../domain/market-stream-channel';
import { MarketSubscriptionState } from '../domain/market-subscription';
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
  it('creates a stable workspace-scoped subscription identity', () => {
    const registry = new MarketSubscriptionRegistry();
    const created = registry.subscribe(CANDLE_CMD, AT);

    expect(String(created.id)).toBe(subscriptionIdFor(CANDLE_CMD));
    expect(String(created.id)).toContain('ws-1');
    expect(created.state).toBe(MarketSubscriptionState.DESIRED);
    expect(created.workspaceId).toBe('ws-1');
  });

  it('treats duplicate subscription commands as idempotent', () => {
    const registry = new MarketSubscriptionRegistry();
    const first = registry.subscribe(CANDLE_CMD, AT);
    registry.markActive('ws-1', String(first.id), '2026-07-18T12:01:00.000Z');

    const repeat = registry.subscribe(CANDLE_CMD, '2026-07-18T12:02:00.000Z');

    expect(String(repeat.id)).toBe(String(first.id));
    // Repeat must not reset ACTIVE back to DESIRED.
    expect(repeat.state).toBe(MarketSubscriptionState.ACTIVE);
    expect(registry.list('ws-1')).toHaveLength(1);
  });

  it('isolates workspaces from each other', () => {
    const registry = new MarketSubscriptionRegistry();
    const mine = registry.subscribe(CANDLE_CMD, AT);
    registry.subscribe({ ...CANDLE_CMD, workspaceId: 'ws-2' }, AT);

    expect(registry.list('ws-1')).toHaveLength(1);
    expect(registry.list('ws-2')).toHaveLength(1);
    expect(registry.get('ws-2', String(mine.id))).toBeNull();
    expect(registry.unsubscribe('ws-2', String(mine.id), AT)).toBeNull();
  });

  it('keeps desired state across connector replacement', () => {
    const registry = new MarketSubscriptionRegistry();
    const sub = registry.subscribe(CANDLE_CMD, AT);
    registry.markActive('ws-1', String(sub.id), '2026-07-18T12:01:00.000Z');

    // Connector instance dies and is replaced.
    registry.markDesiredForSource('binance_spot', '2026-07-18T12:05:00.000Z');

    const desired = registry.desiredFor('binance_spot');
    expect(desired).toHaveLength(1);
    expect(desired[0]?.state).toBe(MarketSubscriptionState.DESIRED);
    expect(String(desired[0]?.id)).toBe(String(sub.id));
  });

  it('stops idempotently and excludes stopped from desired set', () => {
    const registry = new MarketSubscriptionRegistry();
    const sub = registry.subscribe(CANDLE_CMD, AT);

    const stopped = registry.unsubscribe('ws-1', String(sub.id), '2026-07-18T12:03:00.000Z');
    const again = registry.unsubscribe('ws-1', String(sub.id), '2026-07-18T12:04:00.000Z');

    expect(stopped?.state).toBe(MarketSubscriptionState.STOPPED);
    expect(again?.state).toBe(MarketSubscriptionState.STOPPED);
    expect(again?.updatedAt).toBe('2026-07-18T12:03:00.000Z');
    expect(registry.desiredFor('binance_spot')).toHaveLength(0);
  });

  it('contains no Trading Session behavior', () => {
    const registry = new MarketSubscriptionRegistry() as unknown as Record<string, unknown>;
    const memberNames = [
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(registry)),
      ...Object.keys(registry),
    ].map((name) => name.toLowerCase());
    for (const forbidden of ['session', 'order', 'risk', 'signal', 'position']) {
      expect(memberNames.some((name) => name.includes(forbidden))).toBe(false);
    }
  });
});
