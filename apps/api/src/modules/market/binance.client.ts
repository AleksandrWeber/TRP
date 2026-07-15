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

export class BinanceClient {
  async fetchKlines(symbol: string, interval: string, limit = 100): Promise<OhlcvBar[]> {
    const url = new URL('https://api.binance.com/api/v3/klines');
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

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

  /** Exclude the currently forming candle — signals use only closed bars. */
  closedBars(bars: OhlcvBar[]): OhlcvBar[] {
    if (bars.length <= 1) {
      return bars;
    }
    return bars.slice(0, -1);
  }
}
