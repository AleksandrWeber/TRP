/**
 * Internal Binance REST payload shapes (US132).
 * Must not be exported from the live-market-data public barrel.
 */

export type BinanceExchangeInfoResponse = {
  symbols?: BinanceExchangeSymbol[];
};

export type BinanceExchangeSymbol = {
  symbol?: string;
  status?: string;
  baseAsset?: string;
  quoteAsset?: string;
  filters?: BinanceSymbolFilter[];
};

export type BinanceSymbolFilter = {
  filterType?: string;
  tickSize?: string;
  stepSize?: string;
};

/** Binance kline array tuple (REST). */
export type BinanceKlineTuple = [
  number, // open time
  string, // open
  string, // high
  string, // low
  string, // close
  string, // volume
  number, // close time
  string, // quote asset volume
  number, // number of trades
  string, // taker buy base
  string, // taker buy quote
  string, // ignore
];
