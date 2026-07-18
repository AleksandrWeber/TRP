import { describe, expect, it, vi } from 'vitest';
import { Timeframe } from '../../../market-data/timeframe';
import { MarketStreamChannel } from '../../domain/market-stream-channel';
import { ConnectorConnectionState } from '../../ports/connector-connection-state';
import { BinanceRestAdapter } from './binance-rest.adapter';
import { BinanceWebSocketConnector } from './binance-websocket.connector';
import {
  computeRateLimitDelayMs,
  computeReconnectDelayMs,
  DEFAULT_CONNECTOR_RESILIENCE_POLICY,
} from './connector-resilience-policy';
import { createFakeWebSocketFactory, FakeWebSocket } from './fake-websocket';

describe('Connector reconnect and rate-limit resilience (US134)', () => {
  it('changes health immediately on disconnect and reconnects without duplicating subscriptions', async () => {
    const sockets: FakeWebSocket[] = [];
    const sleeps: number[] = [];
    const connector = new BinanceWebSocketConnector({
      webSocketFactory: createFakeWebSocketFactory(sockets),
      sleep: async (ms) => {
        sleeps.push(ms);
      },
      random: () => 0,
      policy: {
        reconnectBaseDelayMs: 100,
        reconnectMaxDelayMs: 1_000,
        reconnectJitterRatio: 0,
        maxReconnectAttempts: 3,
        heartbeatTimeoutMs: 60_000,
      },
    });

    await connector.connect();
    await connector.subscribe({
      workspaceId: 'ws-1',
      instrument: 'BTCUSDT',
      channel: MarketStreamChannel.CLOSED_CANDLE,
      timeframe: Timeframe.H1,
    });
    sockets[0]!.receive({ result: null, id: JSON.parse(sockets[0]!.sent[0]!).id });
    expect(connector.health().state).toBe(ConnectorConnectionState.READY);

    // Unexpected close → immediate disconnected, then reconnecting.
    const reconnectPromise = Promise.resolve().then(async () => {
      // allow close handler to schedule
    });
    sockets[0]!.close(1006, 'abnormal');
    await reconnectPromise;
    // Give microtasks a turn for async onSocketClosed
    await Promise.resolve();
    await Promise.resolve();

    // Wait for reconnect loop to finish (sleep is no-op)
    await vi.waitFor(() => {
      expect(connector.health().state).toBe(ConnectorConnectionState.RECOVERING);
    });

    expect(sleeps.length).toBeGreaterThanOrEqual(1);
    expect(connector.health().awaitingGapRecovery).toBe(true);
    expect(connector.health().state).not.toBe(ConnectorConnectionState.READY);

    // Second socket should re-subscribe once (no duplicate desired keys).
    expect(sockets.length).toBe(2);
    const resub = sockets[1]!.sent.filter((row) => JSON.parse(row).method === 'SUBSCRIBE');
    expect(resub).toHaveLength(1);
    expect(JSON.parse(resub[0]!).params).toEqual(['btcusdt@kline_1h']);

    // Still recovering until gap recovery is marked complete.
    sockets[1]!.receive({ result: null, id: JSON.parse(resub[0]!).id });
    expect(connector.health().state).toBe(ConnectorConnectionState.RECOVERING);

    connector.markGapRecoveryComplete();
    expect(connector.health().state).toBe(ConnectorConnectionState.READY);
    expect(connector.health().awaitingGapRecovery).toBe(false);
  });

  it('uses bounded observable reconnect backoff', () => {
    const d1 = computeReconnectDelayMs(DEFAULT_CONNECTOR_RESILIENCE_POLICY, 1, () => 0);
    const d2 = computeReconnectDelayMs(DEFAULT_CONNECTOR_RESILIENCE_POLICY, 2, () => 0);
    const d5 = computeReconnectDelayMs(DEFAULT_CONNECTOR_RESILIENCE_POLICY, 5, () => 0);
    expect(d1).toBe(DEFAULT_CONNECTOR_RESILIENCE_POLICY.reconnectBaseDelayMs);
    expect(d2).toBeGreaterThan(d1);
    expect(d5).toBeLessThanOrEqual(DEFAULT_CONNECTOR_RESILIENCE_POLICY.reconnectMaxDelayMs);
  });

  it('forces reconnect on heartbeat timeout', async () => {
    const sockets: FakeWebSocket[] = [];
    let now = Date.parse('2026-07-18T10:00:00.000Z');
    const connector = new BinanceWebSocketConnector({
      webSocketFactory: createFakeWebSocketFactory(sockets),
      now: () => now,
      sleep: async () => undefined,
      random: () => 0,
      policy: {
        heartbeatTimeoutMs: 1_000,
        reconnectBaseDelayMs: 10,
        reconnectJitterRatio: 0,
        maxReconnectAttempts: 2,
      },
    });

    await connector.connect();
    expect(connector.health().state).toBe(ConnectorConnectionState.READY);

    now += 5_000;
    await connector.evaluateHeartbeat(now);
    await vi.waitFor(() => {
      expect(connector.health().heartbeatTimedOut).toBe(true);
      expect(
        [ConnectorConnectionState.RECONNECTING, ConnectorConnectionState.RECOVERING].includes(
          connector.health().state,
        ),
      ).toBe(true);
    });
  });

  it('does not busy-loop on rate-limit Retry-After: 0', async () => {
    const waits: number[] = [];
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      if (calls < 3) {
        return new Response('limited', {
          status: 429,
          headers: { 'retry-after': '0' },
        });
      }
      return new Response(
        JSON.stringify({
          symbols: [
            {
              symbol: 'BTCUSDT',
              status: 'TRADING',
              baseAsset: 'BTC',
              quoteAsset: 'USDT',
              filters: [
                { filterType: 'PRICE_FILTER', tickSize: '0.01' },
                { filterType: 'LOT_SIZE', stepSize: '0.001' },
              ],
            },
          ],
        }),
        { status: 200 },
      );
    });

    const adapter = new BinanceRestAdapter({
      fetchImpl,
      sleep: async (ms) => {
        waits.push(ms);
      },
      policy: {
        maxRateLimitRetries: 3,
        rateLimitMinDelayMs: 100,
      },
    });

    await adapter.connect();
    expect(waits.every((ms) => ms >= 100)).toBe(true);
    expect(
      computeRateLimitDelayMs(
        { ...DEFAULT_CONNECTOR_RESILIENCE_POLICY, rateLimitMinDelayMs: 100 },
        1,
        '0',
      ),
    ).toBe(100);
  });

  it('exhausts reconnect attempts into FAILED', async () => {
    let creations = 0;
    const sockets: FakeWebSocket[] = [];
    const connector = new BinanceWebSocketConnector({
      webSocketFactory: (url) => {
        creations += 1;
        const socket = new FakeWebSocket(url);
        sockets.push(socket);
        queueMicrotask(() => {
          if (creations === 1) {
            socket.open();
          } else {
            socket.error('connect failed');
          }
        });
        return socket;
      },
      sleep: async () => undefined,
      random: () => 0,
      policy: {
        maxReconnectAttempts: 2,
        reconnectBaseDelayMs: 1,
        reconnectJitterRatio: 0,
      },
    });

    await connector.connect();
    sockets[0]!.close(1006, 'drop');
    await vi.waitFor(() => {
      expect(connector.health().state).toBe(ConnectorConnectionState.FAILED);
    });
    expect(connector.health().reconnectAttempt).toBe(2);
  });
});
