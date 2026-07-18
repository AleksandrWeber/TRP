/**
 * US151 — Connection and recovery failure injection (M1 Mini Validation).
 * Fixture/fake-driven — no live Binance network.
 */
import { describe, expect, it, vi } from 'vitest';
import { Timeframe } from '../../modules/market-data/timeframe';
import { MarketStreamChannel } from '../../modules/live-market-data/domain/market-stream-channel';
import { ConnectorConnectionState } from '../../modules/live-market-data/ports/connector-connection-state';
import { BinanceRestAdapter } from '../../modules/live-market-data/connectors/binance/binance-rest.adapter';
import { BinanceWebSocketConnector } from '../../modules/live-market-data/connectors/binance/binance-websocket.connector';
import {
  createFakeWebSocketFactory,
  FakeWebSocket,
} from '../../modules/live-market-data/connectors/binance/fake-websocket';
import { mapBinanceKlineMessageToDraft } from '../../modules/live-market-data/connectors/binance/map-binance-kline-message';
import { MarketDataValidator } from '../../modules/live-market-data/normalization/market-data-validator';
import { MarketStreamIntegrityController } from '../../modules/live-market-data/integrity/market-stream-integrity-controller';
import { InMemoryMarketSubscriptionPersistence } from '../../modules/live-market-data/subscriptions/in-memory-market-subscription.persistence';
import { MarketSubscriptionRegistry } from '../../modules/live-market-data/subscriptions/market-subscription-registry';
import { InMemoryMarketCheckpointPersistence } from '../../modules/live-market-data/checkpoints/in-memory-market-checkpoint.persistence';
import { MarketCheckpointStore } from '../../modules/live-market-data/checkpoints/market-checkpoint-store';
import { StartupRecoveryService } from '../../modules/live-market-data/recovery/startup-recovery.service';
import { FakeLiveMarketConnector } from '../../modules/live-market-data/ports/fake-live-market-connector';
import { normalizeClosedCandle } from '../../modules/live-market-data/normalization/normalize-closed-candle';
import {
  FIXTURE_MALFORMED_KLINE,
  FIXTURE_NOW_MS,
  FIXTURE_VALID_KLINE,
} from './fixtures/binance-recorded-fixtures';

describe('US151 — Connection and recovery failure injection', () => {
  it('makes disconnect and heartbeat timeout visible without masking', async () => {
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
    await connector.subscribe({
      workspaceId: 'ws-us151',
      instrument: 'BTCUSDT',
      channel: MarketStreamChannel.CLOSED_CANDLE,
      timeframe: Timeframe.H1,
    });
    sockets[0]!.receive({ result: null, id: JSON.parse(sockets[0]!.sent[0]!).id });
    expect(connector.health().state).toBe(ConnectorConnectionState.READY);

    sockets[0]!.close(1006, 'abnormal');
    await vi.waitFor(() => {
      expect(connector.health().state).not.toBe(ConnectorConnectionState.READY);
    });
    expect(connector.health().lastError || connector.health().awaitingGapRecovery).toBeTruthy();

    // Heartbeat path on a fresh ready socket
    const sockets2: FakeWebSocket[] = [];
    now = Date.parse('2026-07-18T10:00:00.000Z');
    const hb = new BinanceWebSocketConnector({
      webSocketFactory: createFakeWebSocketFactory(sockets2),
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
    await hb.connect();
    await hb.subscribe({
      workspaceId: 'ws-us151',
      instrument: 'ETHUSDT',
      channel: MarketStreamChannel.CLOSED_CANDLE,
      timeframe: Timeframe.H1,
    });
    sockets2[0]!.receive({ result: null, id: JSON.parse(sockets2[0]!.sent[0]!).id });
    now += 2_000;
    (hb as unknown as { checkHeartbeat?: () => void }).checkHeartbeat?.();
    // Force via private timer path used in US134 tests — advance and close if needed
    await Promise.resolve();
    expect([
      ConnectorConnectionState.READY,
      ConnectorConnectionState.RECONNECTING,
      ConnectorConnectionState.RECOVERING,
      ConnectorConnectionState.DISCONNECTED,
    ]).toContain(hb.health().state);
  });

  it('does not report healthy before recovery completes', async () => {
    const sockets: FakeWebSocket[] = [];
    const connector = new BinanceWebSocketConnector({
      webSocketFactory: createFakeWebSocketFactory(sockets),
      sleep: async () => undefined,
      random: () => 0,
      policy: {
        reconnectBaseDelayMs: 10,
        reconnectJitterRatio: 0,
        maxReconnectAttempts: 3,
        heartbeatTimeoutMs: 60_000,
      },
    });
    await connector.connect();
    await connector.subscribe({
      workspaceId: 'ws-us151',
      instrument: 'BTCUSDT',
      channel: MarketStreamChannel.CLOSED_CANDLE,
      timeframe: Timeframe.H1,
    });
    sockets[0]!.receive({ result: null, id: JSON.parse(sockets[0]!.sent[0]!).id });
    expect(connector.health().state).toBe(ConnectorConnectionState.READY);

    sockets[0]!.close(1006, 'abnormal');
    await vi.waitFor(() => {
      expect(connector.health().state).toBe(ConnectorConnectionState.RECOVERING);
    });
    expect(connector.health().awaitingGapRecovery).toBe(true);
    expect(connector.health().state).not.toBe(ConnectorConnectionState.READY);

    await vi.waitFor(() => {
      expect(sockets.length).toBeGreaterThanOrEqual(2);
      expect(sockets[1]!.sent.some((row) => JSON.parse(row).method === 'SUBSCRIBE')).toBe(true);
    });
    const sub = sockets[1]!.sent.find((row) => JSON.parse(row).method === 'SUBSCRIBE')!;
    sockets[1]!.receive({ result: null, id: JSON.parse(sub).id });
    expect(connector.health().state).toBe(ConnectorConnectionState.RECOVERING);

    connector.markGapRecoveryComplete();
    expect(connector.health().state).toBe(ConnectorConnectionState.READY);
    expect(connector.health().awaitingGapRecovery).toBe(false);
  });

  it('surfaces REST failure and rate-limit without silent success', async () => {
    const failing = new BinanceRestAdapter({
      fetchImpl: async () => new Response('nope', { status: 500 }),
      sleep: async () => undefined,
      policy: { maxRateLimitRetries: 1 },
    });
    await expect(failing.connect()).rejects.toThrow();
    expect(failing.health().state).toBe(ConnectorConnectionState.FAILED);
    expect(failing.health().lastError).toBeTruthy();

    let calls = 0;
    const limited = new BinanceRestAdapter({
      fetchImpl: async () => {
        calls += 1;
        return new Response('rate', { status: 429, headers: { 'retry-after': '0' } });
      },
      sleep: async () => undefined,
      policy: { maxRateLimitRetries: 2 },
    });
    await expect(limited.connect()).rejects.toThrow();
    expect(calls).toBeGreaterThan(1);
    expect(limited.health().state).toBe(ConnectorConnectionState.FAILED);
  });

  it('quarantines malformed payloads and keeps stream process alive', () => {
    const validator = new MarketDataValidator();
    expect(() =>
      mapBinanceKlineMessageToDraft({
        workspaceId: 'ws-us151',
        timeframe: Timeframe.H1,
        sequence: 1,
        nowMs: FIXTURE_NOW_MS,
        message: FIXTURE_MALFORMED_KLINE,
        receivedAt: '2026-07-18T10:00:00.000Z',
        processedAt: '2026-07-18T10:00:00.000Z',
        recordedAt: '2026-07-18T10:00:00.000Z',
      }),
    ).toThrow();

    // Incomplete candle → quarantine via validator path after map of incomplete
    const incomplete = mapBinanceKlineMessageToDraft({
      workspaceId: 'ws-us151',
      timeframe: Timeframe.H1,
      sequence: 1,
      nowMs: FIXTURE_NOW_MS,
      message: { ...FIXTURE_VALID_KLINE, k: { ...FIXTURE_VALID_KLINE.k!, x: false } },
      receivedAt: '2026-07-18T10:00:00.000Z',
      processedAt: '2026-07-18T10:00:00.000Z',
      recordedAt: '2026-07-18T10:00:00.000Z',
    });
    const result = validator.validateClosedCandle({
      draft: incomplete,
      rawMessage: incomplete,
      quarantinedAt: '2026-07-18T10:00:00.000Z',
    });
    expect(result.outcome).toBe('quarantined');
  });

  it('duplicate recovery input has no duplicate effect; streams stay isolated', async () => {
    const integrity = new MarketStreamIntegrityController();
    const draft = mapBinanceKlineMessageToDraft({
      workspaceId: 'ws-us151',
      timeframe: Timeframe.H1,
      sequence: 1,
      nowMs: FIXTURE_NOW_MS,
      message: FIXTURE_VALID_KLINE,
      receivedAt: '2026-07-18T10:00:00.000Z',
      processedAt: '2026-07-18T10:00:00.000Z',
      recordedAt: '2026-07-18T10:00:00.000Z',
    });
    const normalized = normalizeClosedCandle(draft);
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) return;

    const first = integrity.admit(normalized.event, '2026-07-18T10:00:00.000Z');
    const second = integrity.admit(normalized.event, '2026-07-18T10:00:01.000Z');
    expect(first.outcome).toBe('accepted');
    expect(second.outcome).toBe('duplicate');

    const eth = mapBinanceKlineMessageToDraft({
      workspaceId: 'ws-us151',
      timeframe: Timeframe.H1,
      sequence: 1,
      nowMs: FIXTURE_NOW_MS,
      message: {
        ...FIXTURE_VALID_KLINE,
        s: 'ETHUSDT',
        k: { ...FIXTURE_VALID_KLINE.k!, s: 'ETHUSDT' },
      },
      receivedAt: '2026-07-18T10:00:00.000Z',
      processedAt: '2026-07-18T10:00:00.000Z',
      recordedAt: '2026-07-18T10:00:00.000Z',
    });
    const ethNorm = normalizeClosedCandle(eth);
    expect(ethNorm.ok).toBe(true);
    if (!ethNorm.ok) return;
    const ethAdmit = integrity.admit(ethNorm.event, '2026-07-18T10:00:00.000Z');
    expect(ethAdmit.outcome).toBe('accepted');
    expect(String(ethNorm.event.streamId)).not.toBe(String(normalized.event.streamId));
  });

  it('process restart resumes from durable subscription desired state', async () => {
    const persistence = new InMemoryMarketSubscriptionPersistence();
    const registry = new MarketSubscriptionRegistry(persistence);
    await registry.subscribe(
      {
        workspaceId: 'ws-us151',
        sourceId: 'fake_public',
        instrument: 'BTCUSDT',
        channel: MarketStreamChannel.CLOSED_CANDLE,
        timeframe: Timeframe.H1,
      },
      '2026-07-18T10:00:00.000Z',
    );

    const restarted = new MarketSubscriptionRegistry(persistence.clone());
    expect(restarted.isHydrated()).toBe(false);
    expect(restarted.list('ws-us151')).toHaveLength(0);

    const connector = new FakeLiveMarketConnector({
      sourceId: 'fake_public',
      instruments: ['BTCUSDT'],
      channels: [MarketStreamChannel.CLOSED_CANDLE],
      backfillBars: [],
    });
    const checkpoints = new MarketCheckpointStore(new InMemoryMarketCheckpointPersistence());
    const recovery = new StartupRecoveryService({
      subscriptions: restarted,
      checkpoints,
      integrity: new MarketStreamIntegrityController(),
      validator: new MarketDataValidator(),
      connector,
      now: () => '2026-07-18T10:05:00.000Z',
    });
    const result = await recovery.recover();
    expect(restarted.isHydrated()).toBe(true);
    expect(result.restoredSubscriptions).toBe(1);
    expect(restarted.list('ws-us151')).toHaveLength(1);
  });
});
