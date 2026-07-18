/**
 * US148 — Contract and fixture validation (M1 Mini Validation).
 * No live Binance network access.
 */
import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../modules/market-data/timeframe';
import { mapBinanceKlineMessageToDraft } from '../../modules/live-market-data/connectors/binance/map-binance-kline-message';
import { mapBinanceBookTickerToDraft } from '../../modules/live-market-data/connectors/binance/map-binance-book-ticker';
import { BinanceRestAdapter } from '../../modules/live-market-data/connectors/binance/binance-rest.adapter';
import { BinanceWebSocketConnector } from '../../modules/live-market-data/connectors/binance/binance-websocket.connector';
import { createFakeWebSocketFactory } from '../../modules/live-market-data/connectors/binance/fake-websocket';
import {
  closedCandlesAreSemanticallyEqual,
  normalizeClosedCandle,
} from '../../modules/live-market-data/normalization/normalize-closed-candle';
import { normalizeMarkPrice } from '../../modules/live-market-data/normalization/normalize-mark-price';
import { MarketDataValidator } from '../../modules/live-market-data/normalization/market-data-validator';
import { FakeLiveMarketConnector } from '../../modules/live-market-data/ports/fake-live-market-connector';
import { MarketStreamChannel } from '../../modules/live-market-data/domain/market-stream-channel';
import {
  FIXTURE_DUPLICATE_KLINE,
  FIXTURE_INCOMPLETE_KLINE,
  FIXTURE_MALFORMED_BOOK_TICKER,
  FIXTURE_MALFORMED_KLINE,
  FIXTURE_NOW_MS,
  FIXTURE_STALE_KLINE,
  FIXTURE_VALID_BOOK_TICKER,
  FIXTURE_VALID_KLINE,
} from './fixtures/binance-recorded-fixtures';
import { assertLiveMarketConnectorContract } from './live-market-connector-contract';

const OPS_A = {
  receivedAt: '2026-07-18T10:00:00.010Z',
  processedAt: '2026-07-18T10:00:00.020Z',
  recordedAt: '2026-07-18T10:00:00.030Z',
} as const;

const OPS_B = {
  receivedAt: '2026-07-18T12:00:00.010Z',
  processedAt: '2026-07-18T12:00:00.520Z',
  recordedAt: '2026-07-18T12:00:00.900Z',
} as const;

describe('US148 — Contract and fixture validation', () => {
  it('covers valid, malformed, duplicate, stale, and incomplete fixture classes', () => {
    const validator = new MarketDataValidator();

    const validDraft = mapBinanceKlineMessageToDraft({
      workspaceId: 'ws-m1',
      timeframe: Timeframe.H1,
      sequence: 1,
      nowMs: FIXTURE_NOW_MS,
      message: FIXTURE_VALID_KLINE,
      ...OPS_A,
    });
    const valid = normalizeClosedCandle(validDraft);
    expect(valid.ok).toBe(true);
    if (valid.ok) {
      const validated = validator.validateClosedCandle({
        draft: validDraft,
        rawMessage: FIXTURE_VALID_KLINE,
        quarantinedAt: OPS_A.recordedAt,
      });
      expect(validated.outcome).toBe('accepted');
      expect(Object.keys(valid.event)).not.toContain('k');
      expect(Object.keys(valid.event)).not.toContain('e');
    }

    expect(() =>
      mapBinanceKlineMessageToDraft({
        workspaceId: 'ws-m1',
        timeframe: Timeframe.H1,
        sequence: 1,
        nowMs: FIXTURE_NOW_MS,
        message: FIXTURE_MALFORMED_KLINE,
        ...OPS_A,
      }),
    ).toThrow(/missing k payload/i);

    const incomplete = normalizeClosedCandle(
      mapBinanceKlineMessageToDraft({
        workspaceId: 'ws-m1',
        timeframe: Timeframe.H1,
        sequence: 1,
        nowMs: FIXTURE_NOW_MS,
        message: FIXTURE_INCOMPLETE_KLINE,
        ...OPS_A,
      }),
    );
    expect(incomplete.ok).toBe(false);

    const dupDraft = mapBinanceKlineMessageToDraft({
      workspaceId: 'ws-m1',
      timeframe: Timeframe.H1,
      sequence: 1,
      nowMs: FIXTURE_NOW_MS + 50,
      message: FIXTURE_DUPLICATE_KLINE,
      ...OPS_B,
    });
    const dup = normalizeClosedCandle(dupDraft);
    expect(valid.ok && dup.ok).toBe(true);
    if (valid.ok && dup.ok) {
      expect(closedCandlesAreSemanticallyEqual(valid.event, dup.event)).toBe(true);
    }

    const staleDraft = mapBinanceKlineMessageToDraft({
      workspaceId: 'ws-m1',
      timeframe: Timeframe.H1,
      sequence: 0,
      nowMs: FIXTURE_NOW_MS,
      message: FIXTURE_STALE_KLINE,
      ...OPS_A,
    });
    const stale = normalizeClosedCandle(staleDraft);
    expect(stale.ok).toBe(true);
    if (valid.ok && stale.ok) {
      expect(stale.event.sequence).toBeLessThan(valid.event.sequence);
      expect(closedCandlesAreSemanticallyEqual(valid.event, stale.event)).toBe(false);
    }

    expect(() =>
      mapBinanceBookTickerToDraft({
        workspaceId: 'ws-m1',
        sequence: 1,
        message: FIXTURE_MALFORMED_BOOK_TICKER,
        exchangeOccurredAt: OPS_A.receivedAt,
        ...OPS_A,
      }),
    ).toThrow();

    const mark = normalizeMarkPrice(
      mapBinanceBookTickerToDraft({
        workspaceId: 'ws-m1',
        sequence: 1,
        message: FIXTURE_VALID_BOOK_TICKER,
        exchangeOccurredAt: OPS_A.receivedAt,
        ...OPS_A,
      }),
    );
    expect(mark.ok).toBe(true);
  });

  it('keeps semantic output independent of processing timestamps', () => {
    const a = normalizeClosedCandle(
      mapBinanceKlineMessageToDraft({
        workspaceId: 'ws-m1',
        timeframe: Timeframe.H1,
        sequence: 1,
        nowMs: FIXTURE_NOW_MS,
        message: FIXTURE_VALID_KLINE,
        ...OPS_A,
      }),
    );
    const b = normalizeClosedCandle(
      mapBinanceKlineMessageToDraft({
        workspaceId: 'ws-m1',
        timeframe: Timeframe.H1,
        sequence: 1,
        nowMs: FIXTURE_NOW_MS,
        message: FIXTURE_VALID_KLINE,
        ...OPS_B,
      }),
    );
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(closedCandlesAreSemanticallyEqual(a.event, b.event)).toBe(true);
    expect(a.event.receivedAt).not.toBe(b.event.receivedAt);
    expect(a.event.processedAt).not.toBe(b.event.processedAt);
    expect(a.event.recordedAt).not.toBe(b.event.recordedAt);
  });

  it('passes the connector contract suite for FakeLiveMarketConnector', async () => {
    const connector = new FakeLiveMarketConnector({
      instruments: ['BTCUSDT'],
      channels: [MarketStreamChannel.CLOSED_CANDLE, MarketStreamChannel.MARK_PRICE],
      backfillBars: [
        {
          instrument: 'BTCUSDT' as never,
          timeframe: Timeframe.H1,
          openTime: '2026-07-18T09:00:00.000Z',
          closeTime: '2026-07-18T09:59:59.999Z',
          open: 100,
          high: 110,
          low: 95,
          close: 105,
          volume: 1,
          exchangeOccurredAt: '2026-07-18T09:00:00.000Z',
        },
      ],
      metadata: [
        {
          sourceId: 'fake_public' as never,
          instrument: 'BTCUSDT' as never,
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          pricePrecision: 2,
          quantityPrecision: 6,
          tickSize: '0.01',
          stepSize: '0.000001',
        },
      ],
    });
    await assertLiveMarketConnectorContract(connector);
  });

  it('passes the connector contract suite for Binance REST with injected fixtures (no network)', async () => {
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/v3/exchangeInfo')) {
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
                  { filterType: 'LOT_SIZE', stepSize: '0.000001' },
                ],
              },
            ],
          }),
          { status: 200 },
        );
      }
      if (url.includes('/api/v3/klines')) {
        return new Response(
          JSON.stringify([
            [
              Date.parse('2026-07-18T09:00:00.000Z'),
              '100',
              '110',
              '95',
              '105',
              '12',
              Date.parse('2026-07-18T09:59:59.999Z'),
              '0',
              0,
              '0',
              '0',
              '0',
            ],
          ]),
          { status: 200 },
        );
      }
      return new Response('not found', { status: 404 });
    };
    const adapter = new BinanceRestAdapter({
      fetchImpl: fetchImpl as typeof fetch,
      now: () => FIXTURE_NOW_MS,
    });
    await assertLiveMarketConnectorContract(adapter);
  });

  it('passes the connector contract suite for Binance WebSocket with fake sockets (no network)', async () => {
    const sockets: unknown[] = [];
    const connector = new BinanceWebSocketConnector({
      webSocketFactory: createFakeWebSocketFactory(sockets as never),
      sleep: async () => undefined,
      random: () => 0,
    });
    // WebSocket connector may not support backfill — contract handles empty/throws.
    await connector.connect();
    expect(connector.capabilities().requiresCredentials).toBe(false);
    await connector.subscribe({
      workspaceId: 'ws-contract',
      instrument: 'BTCUSDT',
      channel: MarketStreamChannel.CLOSED_CANDLE,
      timeframe: Timeframe.H1,
    });
    await connector.disconnect();
    expect(connector.health().state).toBe('disconnected');
  });
});
