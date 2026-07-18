import { describe, expect, it, vi } from 'vitest';
import { Timeframe } from '../../../market-data/timeframe';
import { BinanceRestAdapter } from './binance-rest.adapter';
import { BINANCE_SPOT_SOURCE_ID } from './binance-spot.source';

function exchangeInfoBody() {
  return {
    symbols: [
      {
        symbol: 'BTCUSDT',
        status: 'TRADING',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        filters: [
          { filterType: 'PRICE_FILTER', tickSize: '0.01000000' },
          { filterType: 'LOT_SIZE', stepSize: '0.00001000' },
        ],
      },
    ],
  };
}

function closedKline(openMs: number, closeMs: number, close = '100') {
  return [openMs, '100', '110', '90', close, '1.5', closeMs, '0', 10, '0', '0', '0'];
}

describe('Binance REST metadata and backfill adapter (US132)', () => {
  it('maps exchangeInfo to canonical precision metadata without leaking Binance payloads', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain('/api/v3/exchangeInfo');
      return new Response(JSON.stringify(exchangeInfoBody()), { status: 200 });
    });

    const adapter = new BinanceRestAdapter({ fetchImpl });
    await adapter.connect();
    const meta = await adapter.getInstrumentMetadata('BTCUSDT');

    expect(meta.sourceId).toBe(BINANCE_SPOT_SOURCE_ID);
    expect(meta.instrument).toBe('BTCUSDT');
    expect(meta.baseAsset).toBe('BTC');
    expect(meta.quoteAsset).toBe('USDT');
    expect(meta.pricePrecision).toBe(2);
    expect(meta.quantityPrecision).toBe(5);
    expect(meta.tickSize).toBe('0.01000000');
    expect(meta.stepSize).toBe('0.00001000');
    expect('filters' in meta).toBe(false);
    expect('filterType' in meta).toBe(false);
  });

  it('requires explicit backfill bounds and returns only closed candles', async () => {
    const open1 = Date.parse('2026-07-18T09:00:00.000Z');
    const close1 = Date.parse('2026-07-18T09:59:59.999Z');
    const open2 = Date.parse('2026-07-18T10:00:00.000Z');
    const close2 = Date.parse('2026-07-18T10:59:59.999Z'); // still forming relative to now

    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('exchangeInfo')) {
        return new Response(JSON.stringify(exchangeInfoBody()), { status: 200 });
      }
      return new Response(
        JSON.stringify([closedKline(open1, close1, '101'), closedKline(open2, close2, '102')]),
        { status: 200 },
      );
    });

    const adapter = new BinanceRestAdapter({
      fetchImpl,
      now: () => Date.parse('2026-07-18T10:30:00.000Z'),
    });
    await adapter.connect();

    await expect(
      adapter.backfill({
        workspaceId: 'ws-1',
        instrument: 'BTCUSDT',
        timeframe: Timeframe.H1,
        from: '',
        to: '2026-07-18T11:00:00.000Z',
      }),
    ).rejects.toThrow(/explicit from and to/);

    const bars = await adapter.backfill({
      workspaceId: 'ws-1',
      instrument: 'BTCUSDT',
      timeframe: Timeframe.H1,
      from: '2026-07-18T09:00:00.000Z',
      to: '2026-07-18T11:00:00.000Z',
    });

    expect(bars).toHaveLength(1);
    expect(bars[0]?.close).toBe(101);
    expect(bars[0]?.openTime).toBe('2026-07-18T09:00:00.000Z');
  });

  it('fails visibly on invalid or incomplete responses', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }));
    const adapter = new BinanceRestAdapter({ fetchImpl });
    await expect(adapter.connect()).rejects.toThrow(/invalid or incomplete/);
  });

  it('uses bounded retry/backoff on rate-limit responses', async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      if (calls < 3) {
        return new Response('rate limited', {
          status: 429,
          headers: { 'retry-after': '0' },
        });
      }
      return new Response(JSON.stringify(exchangeInfoBody()), { status: 200 });
    });

    const adapter = new BinanceRestAdapter({
      fetchImpl,
      maxRateLimitRetries: 3,
    });
    await adapter.connect();
    expect(calls).toBe(3);

    const exhausted = new BinanceRestAdapter({
      fetchImpl: vi.fn(async () => new Response('nope', { status: 429 })),
      maxRateLimitRetries: 2,
    });
    await expect(exhausted.connect()).rejects.toThrow(/rate limit exceeded after 2 retries/);
  });

  it('rejects unsupported instruments explicitly', async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify(exchangeInfoBody()), { status: 200 }),
    );
    const adapter = new BinanceRestAdapter({ fetchImpl });
    await adapter.connect();
    await expect(adapter.getInstrumentMetadata('DOGEUSDT')).rejects.toThrow(
      /unsupported instrument/,
    );
  });

  it('does not accept private trading credentials in construction or capabilities', () => {
    const adapter = new BinanceRestAdapter({});
    expect(adapter.capabilities().requiresCredentials).toBe(false);
    expect('apiKey' in adapter).toBe(false);
    expect('apiSecret' in adapter).toBe(false);
  });
});
