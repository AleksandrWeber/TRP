import { describe, expect, it } from 'vitest';
import {
  MarketDataProviderTimeoutError,
  MarketDataProviderUnavailableError,
  UnsupportedMarketSymbolError,
  UnsupportedMarketTimeframeError,
} from '../domain/market-data-domain.error';
import { Timeframe } from '../domain/timeframe';
import { BinanceMarketDataProvider } from './binance-market-data-provider';

type RecordedRequest = { url: URL };

function providerWithResponse(
  body: unknown,
  init: { status?: number } = {},
  recorded: RecordedRequest[] = [],
): BinanceMarketDataProvider {
  return new BinanceMarketDataProvider({
    fetchFn: async (url) => {
      recorded.push({ url: new URL(url) });
      return new Response(JSON.stringify(body), {
        status: init.status ?? 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });
}

/** One Binance kline entry as returned by GET /api/v3/klines. */
function kline(openTimeMs: number, o: string, h: string, l: string, c: string, v: string) {
  return [
    openTimeMs,
    o,
    h,
    l,
    c,
    v,
    openTimeMs + 3_600_000 - 1,
    '1000000',
    100,
    '5.0',
    '500000',
    '0',
  ];
}

describe('BinanceMarketDataProvider (US007)', () => {
  describe('getTicker', () => {
    it('maps /api/v3/ticker/price into a domain Ticker', async () => {
      const recorded: RecordedRequest[] = [];
      const provider = providerWithResponse(
        { symbol: 'BTCUSDT', price: '97012.34000000' },
        {},
        recorded,
      );

      const ticker = await provider.getTicker('BTCUSDT');

      expect(ticker.symbol).toBe('BTCUSDT');
      expect(ticker.price).toBe(97012.34);
      expect(Number.isFinite(Date.parse(ticker.timestamp))).toBe(true);
      expect(recorded[0].url.pathname).toBe('/api/v3/ticker/price');
      expect(recorded[0].url.searchParams.get('symbol')).toBe('BTCUSDT');
    });

    it('rejects a malformed symbol before any network call', async () => {
      let called = false;
      const provider = new BinanceMarketDataProvider({
        fetchFn: async () => {
          called = true;
          return new Response('{}');
        },
      });

      await expect(provider.getTicker('btc/usdt')).rejects.toBeInstanceOf(
        UnsupportedMarketSymbolError,
      );
      expect(called).toBe(false);
    });

    it('maps Binance -1121 (invalid symbol) to UnsupportedMarketSymbolError', async () => {
      const provider = providerWithResponse(
        { code: -1121, msg: 'Invalid symbol.' },
        { status: 400 },
      );

      await expect(provider.getTicker('NOSUCHPAIR')).rejects.toBeInstanceOf(
        UnsupportedMarketSymbolError,
      );
    });

    it('converts an unexpected payload shape into PROVIDER_UNAVAILABLE', async () => {
      const provider = providerWithResponse({ totally: 'unexpected' });

      await expect(provider.getTicker('BTCUSDT')).rejects.toBeInstanceOf(
        MarketDataProviderUnavailableError,
      );
    });

    it('converts a non-numeric price into PROVIDER_UNAVAILABLE via the domain factory', async () => {
      const provider = providerWithResponse({ symbol: 'BTCUSDT', price: 'not-a-number' });

      await expect(provider.getTicker('BTCUSDT')).rejects.toBeInstanceOf(
        MarketDataProviderUnavailableError,
      );
    });
  });

  describe('getCandles', () => {
    const OPEN_MS = Date.parse('2026-07-01T00:00:00.000Z');

    it('maps /api/v3/klines into contiguous domain Candles with exclusive closeTime', async () => {
      const recorded: RecordedRequest[] = [];
      const provider = providerWithResponse(
        [
          kline(OPEN_MS, '100.0', '110.0', '95.0', '105.0', '12.5'),
          kline(OPEN_MS + 3_600_000, '105.0', '107.0', '101.0', '102.0', '8.25'),
        ],
        {},
        recorded,
      );

      const candles = await provider.getCandles('BTCUSDT', Timeframe.H1, 2);

      expect(candles).toHaveLength(2);
      expect(candles[0]).toMatchObject({
        symbol: 'BTCUSDT',
        timeframe: Timeframe.H1,
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 12.5,
      });
      // Binance closes at open + tf − 1ms; the domain uses an exclusive end.
      expect(candles[0].openTime).toBe('2026-07-01T00:00:00.000Z');
      expect(candles[0].closeTime).toBe('2026-07-01T01:00:00.000Z');
      expect(candles[1].openTime).toBe(candles[0].closeTime);

      expect(recorded[0].url.pathname).toBe('/api/v3/klines');
      expect(recorded[0].url.searchParams.get('interval')).toBe('1h');
      expect(recorded[0].url.searchParams.get('limit')).toBe('2');
    });

    it('requests the Binance interval matching every domain timeframe', async () => {
      for (const [timeframe, interval] of [
        [Timeframe.M1, '1m'],
        [Timeframe.M5, '5m'],
        [Timeframe.M15, '15m'],
        [Timeframe.H1, '1h'],
        [Timeframe.H4, '4h'],
        [Timeframe.D1, '1d'],
      ] as const) {
        const recorded: RecordedRequest[] = [];
        const provider = providerWithResponse([], {}, recorded);
        await provider.getCandles('BTCUSDT', timeframe, 1);
        expect(recorded[0].url.searchParams.get('interval')).toBe(interval);
      }
    });

    it('rejects an unmapped timeframe before any network call', async () => {
      const provider = providerWithResponse([]);

      await expect(provider.getCandles('BTCUSDT', '2w' as Timeframe, 10)).rejects.toBeInstanceOf(
        UnsupportedMarketTimeframeError,
      );
    });

    it('rejects an out-of-range limit', async () => {
      const provider = providerWithResponse([]);

      await expect(provider.getCandles('BTCUSDT', Timeframe.H1, 0)).rejects.toThrow(/limit/);
      await expect(provider.getCandles('BTCUSDT', Timeframe.H1, 1.5)).rejects.toThrow(/limit/);
      await expect(provider.getCandles('BTCUSDT', Timeframe.H1, 1001)).rejects.toThrow(/limit/);
    });

    it('converts an invariant-violating kline into PROVIDER_UNAVAILABLE', async () => {
      // high below open violates the Candle domain invariant.
      const provider = providerWithResponse([
        kline(OPEN_MS, '100.0', '90.0', '80.0', '95.0', '1.0'),
      ]);

      await expect(provider.getCandles('BTCUSDT', Timeframe.H1, 1)).rejects.toBeInstanceOf(
        MarketDataProviderUnavailableError,
      );
    });

    it('converts a non-array payload into PROVIDER_UNAVAILABLE', async () => {
      const provider = providerWithResponse({ msg: 'not an array' });

      await expect(provider.getCandles('BTCUSDT', Timeframe.H1, 1)).rejects.toBeInstanceOf(
        MarketDataProviderUnavailableError,
      );
    });
  });

  describe('error handling', () => {
    it('maps HTTP 5xx to PROVIDER_UNAVAILABLE', async () => {
      const provider = providerWithResponse({ msg: 'boom' }, { status: 503 });

      await expect(provider.getTicker('BTCUSDT')).rejects.toMatchObject({
        code: 'PROVIDER_UNAVAILABLE',
        message: expect.stringContaining('503'),
      });
    });

    it('maps HTTP 429 to a rate-limit PROVIDER_UNAVAILABLE', async () => {
      const provider = providerWithResponse({ msg: 'slow down' }, { status: 429 });

      await expect(provider.getTicker('BTCUSDT')).rejects.toMatchObject({
        code: 'PROVIDER_UNAVAILABLE',
        message: expect.stringContaining('rate limited'),
      });
    });

    it('maps an aborted request to PROVIDER_TIMEOUT', async () => {
      const provider = new BinanceMarketDataProvider({
        timeoutMs: 5,
        fetchFn: async (_url, { signal }) =>
          new Promise<Response>((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason));
          }),
      });

      await expect(provider.getTicker('BTCUSDT')).rejects.toBeInstanceOf(
        MarketDataProviderTimeoutError,
      );
    });

    it('maps a network failure to PROVIDER_UNAVAILABLE without leaking internals', async () => {
      const provider = new BinanceMarketDataProvider({
        fetchFn: async () => {
          throw new TypeError('fetch failed: ECONNREFUSED 1.2.3.4:443');
        },
      });

      await expect(provider.getTicker('BTCUSDT')).rejects.toMatchObject({
        code: 'PROVIDER_UNAVAILABLE',
        message: expect.not.stringContaining('ECONNREFUSED'),
      });
    });

    it('maps malformed JSON to PROVIDER_UNAVAILABLE', async () => {
      const provider = new BinanceMarketDataProvider({
        fetchFn: async () => new Response('<html>maintenance</html>', { status: 200 }),
      });

      await expect(provider.getTicker('BTCUSDT')).rejects.toMatchObject({
        code: 'PROVIDER_UNAVAILABLE',
        message: expect.stringContaining('malformed JSON'),
      });
    });
  });

  describe('health', () => {
    it('reports ok when ping succeeds', async () => {
      const recorded: RecordedRequest[] = [];
      const provider = providerWithResponse({}, {}, recorded);

      await expect(provider.health()).resolves.toMatchObject({
        providerId: 'binance',
        status: 'ok',
      });
      expect(recorded[0].url.pathname).toBe('/api/v3/ping');
    });

    it('reports down when ping fails, without throwing', async () => {
      const provider = new BinanceMarketDataProvider({
        fetchFn: async () => {
          throw new TypeError('fetch failed');
        },
      });

      await expect(provider.health()).resolves.toMatchObject({
        providerId: 'binance',
        status: 'down',
      });
    });

    it('reports down when ping times out', async () => {
      const provider = new BinanceMarketDataProvider({
        timeoutMs: 5,
        fetchFn: async (_url, { signal }) =>
          new Promise<Response>((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason));
          }),
      });

      const health = await provider.health();
      expect(health.status).toBe('down');
      expect(health.detail).toContain('timed out');
    });
  });

  it('honors a custom base URL', async () => {
    const recorded: RecordedRequest[] = [];
    const provider = new BinanceMarketDataProvider({
      baseUrl: 'https://api1.binance.com/',
      fetchFn: async (url) => {
        recorded.push({ url: new URL(url) });
        return new Response(JSON.stringify({ symbol: 'BTCUSDT', price: '1.0' }));
      },
    });

    await provider.getTicker('BTCUSDT');
    expect(recorded[0].url.origin).toBe('https://api1.binance.com');
  });
});
