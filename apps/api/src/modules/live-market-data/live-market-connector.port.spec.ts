import { describe, expect, it, beforeEach } from 'vitest';
import { Timeframe } from '../market-data/timeframe';
import { MarketStreamChannel } from './domain/market-stream-channel';
import { FakeLiveMarketConnector } from './ports/fake-live-market-connector';
import { LiveMarketConnectorRegistry } from './ports/live-market-connector-registry';
import { ConnectorConnectionState } from './ports/connector-connection-state';
import type { LiveMarketConnector } from './ports/live-market-connector';

describe('Live Market Connector port and registry (US131)', () => {
  let registry: LiveMarketConnectorRegistry;

  beforeEach(() => {
    registry = new LiveMarketConnectorRegistry();
  });

  it('registers a public connector and resolves by sourceId', () => {
    const connector = new FakeLiveMarketConnector({ sourceId: 'fake_public' });
    registry.register(connector);

    expect(registry.resolve('fake_public')).toBe(connector);
    expect(registry.sourceIds()).toEqual(['fake_public']);
    expect(connector.capabilities().requiresCredentials).toBe(false);
  });

  it('prevents duplicate provider registration', () => {
    registry.register(new FakeLiveMarketConnector({ sourceId: 'fake_public' }));
    expect(() =>
      registry.register(new FakeLiveMarketConnector({ sourceId: 'fake_public' })),
    ).toThrow(/already registered/);
  });

  it('rejects connectors that require credentials', () => {
    const bad: LiveMarketConnector = {
      sourceId: 'private_bad' as never,
      capabilities: () =>
        Object.freeze({
          supportsClosedCandle: true,
          supportsMarkPrice: false,
          supportsBackfill: false,
          requiresCredentials: true as false,
        }),
      connect: async () => undefined,
      disconnect: async () => undefined,
      subscribe: async () => undefined,
      unsubscribe: async () => undefined,
      backfill: async () => [],
      health: () =>
        Object.freeze({
          state: ConnectorConnectionState.DISCONNECTED,
          lastError: null,
          updatedAt: '2026-07-18T00:00:00.000Z',
        }),
      supportsInstrument: () => true,
      supportsChannel: () => true,
    };

    expect(() => registry.register(bad)).toThrow(/must not require credentials/);
  });

  it('fails explicitly for unsupported instruments and channels', async () => {
    const connector = new FakeLiveMarketConnector({
      instruments: ['BTCUSDT'],
      channels: [MarketStreamChannel.CLOSED_CANDLE],
    });
    await connector.connect();

    await expect(
      connector.subscribe({
        workspaceId: 'ws-1',
        instrument: 'DOGEUSDT',
        channel: MarketStreamChannel.CLOSED_CANDLE,
        timeframe: Timeframe.H1,
      }),
    ).rejects.toThrow(/unsupported instrument/);

    await expect(
      connector.subscribe({
        workspaceId: 'ws-1',
        instrument: 'BTCUSDT',
        channel: MarketStreamChannel.MARK_PRICE,
      }),
    ).rejects.toThrow(/unsupported channel/);
  });

  it('exposes connect/subscribe/unsubscribe/backfill/health without trading types', async () => {
    const connector = new FakeLiveMarketConnector({
      backfillBars: [
        {
          instrument: 'BTCUSDT' as never,
          timeframe: Timeframe.H1,
          openTime: '2026-07-18T09:00:00.000Z',
          closeTime: '2026-07-18T10:00:00.000Z',
          open: 1,
          high: 2,
          low: 1,
          close: 1.5,
          volume: 10,
          exchangeOccurredAt: '2026-07-18T09:00:00.000Z',
        },
      ],
    });

    await connector.connect();
    expect(connector.health().state).toBe(ConnectorConnectionState.READY);

    await connector.subscribe({
      workspaceId: 'ws-1',
      instrument: 'BTCUSDT',
      channel: MarketStreamChannel.CLOSED_CANDLE,
      timeframe: Timeframe.H1,
    });
    expect(connector.activeSubscriptions()).toHaveLength(1);

    const bars = await connector.backfill({
      workspaceId: 'ws-1',
      instrument: 'BTCUSDT',
      timeframe: Timeframe.H1,
      from: '2026-07-18T09:00:00.000Z',
      to: '2026-07-18T10:00:00.000Z',
    });
    expect(bars).toHaveLength(1);

    await connector.unsubscribe({
      workspaceId: 'ws-1',
      instrument: 'BTCUSDT',
      channel: MarketStreamChannel.CLOSED_CANDLE,
      timeframe: Timeframe.H1,
    });
    await connector.disconnect();
    expect(connector.health().state).toBe(ConnectorConnectionState.DISCONNECTED);

    const forbidden = [
      'orderId',
      'signalId',
      'strategyId',
      'riskDecisionId',
      'positionId',
      'ledgerEntryId',
    ];
    for (const field of forbidden) {
      expect(field in connector).toBe(false);
      expect(field in connector.capabilities()).toBe(false);
    }
  });

  it('does not use network access in the fake connector', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error('network must not be called');
    }) as typeof fetch;

    try {
      const connector = new FakeLiveMarketConnector();
      registry.register(connector);
      await connector.connect();
      await connector.subscribe({
        workspaceId: 'ws-1',
        instrument: 'BTCUSDT',
        channel: MarketStreamChannel.CLOSED_CANDLE,
        timeframe: Timeframe.M15,
      });
      await connector.backfill({
        workspaceId: 'ws-1',
        instrument: 'BTCUSDT',
        timeframe: Timeframe.M15,
        from: '2026-07-18T00:00:00.000Z',
        to: '2026-07-18T01:00:00.000Z',
      });
      expect(registry.resolve('fake_public').health().state).toBe(ConnectorConnectionState.READY);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
