import { afterEach, describe, expect, it, vi } from 'vitest';
import { BinanceClient } from './binance.client';

const HOUR_MS = 60 * 60 * 1000;

function kline(
  timestamp: number,
): [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
] {
  return [
    timestamp,
    '100',
    '110',
    '90',
    '105',
    '10',
    timestamp + HOUR_MS - 1,
    '0',
    1,
    '0',
    '0',
    '0',
  ];
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('BinanceClient', () => {
  it('paginates a time range with requests capped at 1000 and removes duplicate candles', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => kline(index * HOUR_MS));
    const secondPage = [kline(999 * HOUR_MS), kline(1000 * HOUR_MS), kline(1001 * HOUR_MS)];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(firstPage)))
      .mockResolvedValueOnce(new Response(JSON.stringify(secondPage)));
    vi.stubGlobal('fetch', fetchMock);

    const bars = await new BinanceClient().fetchHistoricalKlines(
      'BTCUSDT',
      '1h',
      0,
      1001 * HOUR_MS,
    );

    expect(bars).toHaveLength(1002);
    expect(bars[0].timestamp).toBe(0);
    expect(bars.at(-1)?.timestamp).toBe(1001 * HOUR_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstUrl = new URL(String(fetchMock.mock.calls[0][0]));
    const secondUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(firstUrl.searchParams.get('limit')).toBe('1000');
    expect(firstUrl.searchParams.get('startTime')).toBe('0');
    expect(firstUrl.searchParams.get('endTime')).toBe(String(1001 * HOUR_MS));
    expect(secondUrl.searchParams.get('startTime')).toBe(String(999 * HOUR_MS + 1));
  });

  it('retries a rate-limited request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'retry-after': '0' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([kline(0)])));
    vi.stubGlobal('fetch', fetchMock);

    const bars = await new BinanceClient().fetchKlines('BTCUSDT', '1h', 1);

    expect(bars).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops safely when Binance returns an empty page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([]))));

    await expect(
      new BinanceClient().fetchHistoricalKlines('BTCUSDT', '1h', 0, HOUR_MS),
    ).resolves.toEqual([]);
  });
});
