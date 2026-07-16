import type { OhlcvBar } from '@trp/research';

type BinanceKline = [
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
];

type KlineRequest = {
  startTime?: number;
  endTime?: number;
  limit?: number;
};

const MAX_KLINES_PER_REQUEST = 1000;
const MAX_PAGES_PER_IMPORT = 10_000;
const MAX_RATE_LIMIT_RETRIES = 3;

export class BinanceClient {
  async fetchKlines(symbol: string, interval: string, limit = 100): Promise<OhlcvBar[]> {
    return this.fetchKlinesPage(symbol, interval, { limit });
  }

  async fetchHistoricalKlines(
    symbol: string,
    interval: string,
    startTime: number,
    endTime: number,
  ): Promise<OhlcvBar[]> {
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || startTime > endTime) {
      throw new Error('startTime and endTime must be valid timestamps with startTime <= endTime');
    }

    const barsByTimestamp = new Map<number, OhlcvBar>();
    let cursor = startTime;
    let exhausted = false;

    for (let page = 0; page < MAX_PAGES_PER_IMPORT && cursor <= endTime; page += 1) {
      const bars = await this.fetchKlinesPage(symbol, interval, {
        startTime: cursor,
        endTime,
        limit: MAX_KLINES_PER_REQUEST,
      });

      if (bars.length === 0) {
        exhausted = true;
        break;
      }

      for (const bar of bars) {
        if (bar.timestamp >= startTime && bar.timestamp <= endTime) {
          barsByTimestamp.set(bar.timestamp, bar);
        }
      }

      const nextCursor = bars.at(-1)!.timestamp + 1;
      if (nextCursor <= cursor) {
        throw new Error('Binance pagination cursor did not advance');
      }

      cursor = nextCursor;
      if (bars.length < MAX_KLINES_PER_REQUEST) {
        exhausted = true;
        break;
      }
    }

    if (!exhausted && cursor <= endTime) {
      throw new Error(`Binance pagination exceeded ${MAX_PAGES_PER_IMPORT} pages`);
    }

    return [...barsByTimestamp.values()].sort((a, b) => a.timestamp - b.timestamp);
  }

  private async fetchKlinesPage(
    symbol: string,
    interval: string,
    { startTime, endTime, limit = 100 }: KlineRequest,
  ): Promise<OhlcvBar[]> {
    const url = new URL('https://api.binance.com/api/v3/klines');
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);
    url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), MAX_KLINES_PER_REQUEST)));
    if (startTime !== undefined) {
      url.searchParams.set('startTime', String(startTime));
    }
    if (endTime !== undefined) {
      url.searchParams.set('endTime', String(endTime));
    }

    const response = await this.fetchWithRateLimitRetry(url);

    const data = (await response.json()) as BinanceKline[];
    return data.map((kline) => ({
      timestamp: kline[0],
      open: Number(kline[1]),
      high: Number(kline[2]),
      low: Number(kline[3]),
      close: Number(kline[4]),
      volume: Number(kline[5]),
    }));
  }

  private async fetchWithRateLimitRetry(url: URL): Promise<Response> {
    for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
      const response = await fetch(url);
      if (response.status !== 418 && response.status !== 429) {
        if (!response.ok) {
          throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
        }
        return response;
      }

      if (attempt === MAX_RATE_LIMIT_RETRIES) {
        throw new Error(`Binance rate limit exceeded after ${MAX_RATE_LIMIT_RETRIES} retries`);
      }

      const retryAfterSeconds = Number(response.headers.get('retry-after'));
      const waitMs = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1000
        : 250 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    throw new Error('Binance request retry loop ended unexpectedly');
  }

  /** Exclude the currently forming candle — signals use only closed bars. */
  closedBars(bars: OhlcvBar[]): OhlcvBar[] {
    if (bars.length <= 1) {
      return bars;
    }
    return bars.slice(0, -1);
  }
}
