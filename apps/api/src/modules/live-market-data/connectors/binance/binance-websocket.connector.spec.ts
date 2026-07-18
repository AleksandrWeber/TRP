import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../../market-data/timeframe';
import { MarketStreamChannel } from '../../domain/market-stream-channel';
import { ConnectorConnectionState } from '../../ports/connector-connection-state';
import { BinanceWebSocketConnector } from './binance-websocket.connector';
import { createFakeWebSocketFactory, type FakeWebSocket } from './fake-websocket';

describe('Binance WebSocket connection lifecycle (US133)', () => {
  it('exposes explicit connection states and tracks subscription acknowledgement', async () => {
    const sockets: FakeWebSocket[] = [];
    const connector = new BinanceWebSocketConnector({
      webSocketFactory: createFakeWebSocketFactory(sockets),
    });

    expect(connector.health().state).toBe(ConnectorConnectionState.DISCONNECTED);
    await connector.connect();
    expect(connector.health().state).toBe(ConnectorConnectionState.READY);
    expect(sockets).toHaveLength(1);

    await connector.subscribe({
      workspaceId: 'ws-1',
      instrument: 'BTCUSDT',
      channel: MarketStreamChannel.CLOSED_CANDLE,
      timeframe: Timeframe.H1,
    });

    expect(connector.health().state).toBe(ConnectorConnectionState.SUBSCRIBING);
    const pending = connector.listSubscriptions();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.status).toBe('pending');
    expect(pending[0]?.streamName).toBe('btcusdt@kline_1h');

    const sent = JSON.parse(sockets[0]!.sent[0]!);
    expect(sent.method).toBe('SUBSCRIBE');
    expect(sent.params).toEqual(['btcusdt@kline_1h']);

    sockets[0]!.receive({ result: null, id: sent.id });
    expect(connector.listSubscriptions()[0]?.status).toBe('acked');
    expect(connector.health().state).toBe(ConnectorConnectionState.READY);
  });

  it('treats duplicate subscribe/unsubscribe as idempotent', async () => {
    const sockets: FakeWebSocket[] = [];
    const connector = new BinanceWebSocketConnector({
      webSocketFactory: createFakeWebSocketFactory(sockets),
    });
    await connector.connect();

    const request = {
      workspaceId: 'ws-1',
      instrument: 'ETHUSDT',
      channel: MarketStreamChannel.MARK_PRICE,
    } as const;

    await connector.subscribe(request);
    await connector.subscribe(request);
    expect(sockets[0]!.sent).toHaveLength(1);
    expect(connector.listSubscriptions()).toHaveLength(1);

    await connector.unsubscribe(request);
    await connector.unsubscribe(request);
    expect(connector.listSubscriptions()).toHaveLength(0);
    expect(sockets[0]!.sent.some((row) => JSON.parse(row).method === 'UNSUBSCRIBE')).toBe(true);
  });

  it('closes the socket cleanly on shutdown', async () => {
    const sockets: FakeWebSocket[] = [];
    const connector = new BinanceWebSocketConnector({
      webSocketFactory: createFakeWebSocketFactory(sockets),
    });
    await connector.connect();
    await connector.subscribe({
      workspaceId: 'ws-1',
      instrument: 'BTCUSDT',
      channel: MarketStreamChannel.CLOSED_CANDLE,
      timeframe: Timeframe.M15,
    });

    await connector.disconnect();
    expect(connector.health().state).toBe(ConnectorConnectionState.DISCONNECTED);
    expect(connector.listSubscriptions()).toHaveLength(0);
    expect(sockets[0]!.readyState).toBe(3); // CLOSED
  });

  it('keeps raw messages inside the adapter', async () => {
    const sockets: FakeWebSocket[] = [];
    const connector = new BinanceWebSocketConnector({
      webSocketFactory: createFakeWebSocketFactory(sockets),
    });
    await connector.connect();

    const raw = {
      e: 'kline',
      E: 1,
      s: 'BTCUSDT',
      k: { t: 1, T: 2, o: '1', h: '2', l: '1', c: '1.5', v: '10', x: true },
    };
    sockets[0]!.receive(raw);

    expect(connector.getRawMessageCount()).toBe(1);
    // Public surface must not expose raw exchange payload fields.
    expect(JSON.stringify(connector.health())).not.toContain('"e":"kline"');
    expect(JSON.stringify(connector.listSubscriptions())).not.toContain('"e":"kline"');
    expect('lastRawMessage' in connector).toBe(false);
  });

  it('rejects private trading credentials', () => {
    expect(
      () =>
        new BinanceWebSocketConnector({
          webSocketFactory: createFakeWebSocketFactory([]),
          // @ts-expect-error intentional credential rejection test
          apiKey: 'secret',
        }),
    ).toThrow(/does not accept private trading credentials/);
  });

  it('does not require credentials for public streams', () => {
    const connector = new BinanceWebSocketConnector({
      webSocketFactory: createFakeWebSocketFactory([]),
    });
    expect(connector.capabilities().requiresCredentials).toBe(false);
  });
});
