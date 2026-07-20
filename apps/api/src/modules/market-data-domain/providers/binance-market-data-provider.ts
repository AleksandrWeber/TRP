import { createCandle, type Candle } from '../domain/candle';
import {
  MarketDataDomainError,
  MarketDataProviderTimeoutError,
  MarketDataProviderUnavailableError,
  UnsupportedMarketSymbolError,
  UnsupportedMarketTimeframeError,
} from '../domain/market-data-domain.error';
import { createTicker, type Ticker } from '../domain/ticker';
import { Timeframe, timeframeToMillis } from '../domain/timeframe';
import type { MarketDataProvider, MarketDataProviderHealth } from '../ports/market-data-provider';

export const BINANCE_MARKET_DATA_PROVIDER_ID = 'binance';
export const BINANCE_DEFAULT_BASE_URL = 'https://api.binance.com';
export const BINANCE_DEFAULT_TIMEOUT_MS = 5_000;
/** Ping latency above this is reported as `degraded` instead of `ok`. */
export const BINANCE_DEGRADED_LATENCY_MS = 2_000;

const BINANCE_MAX_KLINES_LIMIT = 1_000;

/** Binance Spot error codes relevant to this provider (public REST API). */
const BINANCE_INVALID_TIMEFRAME_CODE = -1120;
const BINANCE_INVALID_SYMBOL_CODE = -1121;

/**
 * Every domain timeframe maps 1:1 onto a Binance Spot kline interval.
 * Kept as an explicit record so an unmapped timeframe fails as
 * UNSUPPORTED_TIMEFRAME instead of leaking an arbitrary string upstream.
 */
const BINANCE_INTERVAL_BY_TIMEFRAME: Readonly<Record<Timeframe, string>> = Object.freeze({
  [Timeframe.M1]: '1m',
  [Timeframe.M5]: '5m',
  [Timeframe.M15]: '15m',
  [Timeframe.H1]: '1h',
  [Timeframe.H4]: '4h',
  [Timeframe.D1]: '1d',
});

type FetchLike = (url: string, init: { signal: AbortSignal }) => Promise<Response>;

export type BinanceMarketDataProviderOptions = Readonly<{
  /** Override for tests / regional clusters. Default: https://api.binance.com */
  baseUrl?: string;
  /** Per-request timeout. Default: 5000ms. */
  timeoutMs?: number;
  /** Injectable transport for tests. Default: global fetch. */
  fetchFn?: FetchLike;
}>;

/** Context for translating a Binance error payload into a domain error. */
type RequestContext = Readonly<{
  symbol?: string;
  timeframe?: string;
}>;

/**
 * Live Binance Spot market data provider (US007).
 *
 * Public REST endpoints only — no API key, no WebSocket:
 * - GET /api/v3/ticker/price  → getTicker
 * - GET /api/v3/klines        → getCandles
 * - GET /api/v3/ping          → health
 *
 * Every failure (HTTP status, timeout, exchange error code, malformed or
 * invariant-violating payload) is converted into a MarketDataDomainError;
 * Binance payloads never cross the MarketDataProvider port boundary.
 */
export class BinanceMarketDataProvider implements MarketDataProvider {
  readonly id = BINANCE_MARKET_DATA_PROVIDER_ID;

  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: FetchLike;

  constructor(options: BinanceMarketDataProviderOptions = {}) {
    this.baseUrl = (options.baseUrl ?? BINANCE_DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? BINANCE_DEFAULT_TIMEOUT_MS;
    this.fetchFn = options.fetchFn ?? ((url, init) => fetch(url, init));
  }

  async getTicker(symbol: string): Promise<Ticker> {
    this.assertSupportedSymbol(symbol);

    const payload = await this.requestJson('/api/v3/ticker/price', { symbol }, { symbol });

    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof (payload as { symbol?: unknown }).symbol !== 'string' ||
      typeof (payload as { price?: unknown }).price !== 'string'
    ) {
      throw new MarketDataProviderUnavailableError(this.id, 'unexpected ticker payload shape');
    }

    const price = Number((payload as { price: string }).price);
    return this.intoDomain(() =>
      createTicker({
        symbol,
        price,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  async getCandles(symbol: string, timeframe: Timeframe, limit: number): Promise<Candle[]> {
    this.assertSupportedSymbol(symbol);
    const interval = BINANCE_INTERVAL_BY_TIMEFRAME[timeframe];
    if (interval === undefined) {
      throw new UnsupportedMarketTimeframeError(String(timeframe), this.id);
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > BINANCE_MAX_KLINES_LIMIT) {
      throw new Error(`limit must be an integer between 1 and ${BINANCE_MAX_KLINES_LIMIT}`);
    }

    const payload = await this.requestJson(
      '/api/v3/klines',
      { symbol, interval, limit: String(limit) },
      { symbol, timeframe },
    );

    if (!Array.isArray(payload)) {
      throw new MarketDataProviderUnavailableError(this.id, 'unexpected klines payload shape');
    }

    const bucketMs = timeframeToMillis(timeframe);
    return payload.map((kline) => this.intoCandle(kline, symbol, timeframe, bucketMs));
  }

  async health(): Promise<MarketDataProviderHealth> {
    const startedAt = Date.now();
    try {
      await this.requestJson('/api/v3/ping', {}, {});
    } catch (error) {
      return Object.freeze({
        providerId: this.id,
        status: 'down' as const,
        detail:
          error instanceof MarketDataDomainError ? error.message : 'Binance Spot REST unreachable',
      });
    }

    const latencyMs = Date.now() - startedAt;
    if (latencyMs > BINANCE_DEGRADED_LATENCY_MS) {
      return Object.freeze({
        providerId: this.id,
        status: 'degraded' as const,
        detail: `Binance Spot REST slow — ping took ${latencyMs}ms`,
      });
    }
    return Object.freeze({
      providerId: this.id,
      status: 'ok' as const,
      detail: `Binance Spot REST reachable — ping ${latencyMs}ms`,
    });
  }

  private assertSupportedSymbol(symbol: string): void {
    if (!/^[A-Z0-9]+$/.test(symbol)) {
      throw new UnsupportedMarketSymbolError(symbol, this.id);
    }
  }

  /** Fetch + status/timeout/parse handling; throws domain errors only. */
  private async requestJson(
    path: string,
    query: Record<string, string>,
    context: RequestContext,
  ): Promise<unknown> {
    const url = new URL(this.baseUrl + path);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await this.fetchFn(url.toString(), {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if (isTimeoutError(error)) {
        throw new MarketDataProviderTimeoutError(this.id, this.timeoutMs);
      }
      throw new MarketDataProviderUnavailableError(this.id, 'network request failed');
    }

    if (!response.ok) {
      throw await this.errorFromResponse(response, context);
    }

    try {
      return await response.json();
    } catch {
      throw new MarketDataProviderUnavailableError(this.id, 'malformed JSON response');
    }
  }

  /**
   * Binance error bodies look like {"code":-1121,"msg":"Invalid symbol."}.
   * Known codes become precise domain errors; everything else collapses into
   * PROVIDER_UNAVAILABLE with the HTTP status only.
   */
  private async errorFromResponse(
    response: Response,
    context: RequestContext,
  ): Promise<MarketDataDomainError> {
    const code = await readBinanceErrorCode(response);
    if (code === BINANCE_INVALID_SYMBOL_CODE && context.symbol !== undefined) {
      return new UnsupportedMarketSymbolError(context.symbol, this.id);
    }
    if (code === BINANCE_INVALID_TIMEFRAME_CODE && context.timeframe !== undefined) {
      return new UnsupportedMarketTimeframeError(context.timeframe, this.id);
    }
    if (response.status === 418 || response.status === 429) {
      return new MarketDataProviderUnavailableError(
        this.id,
        `rate limited (HTTP ${response.status})`,
      );
    }
    return new MarketDataProviderUnavailableError(this.id, `upstream HTTP ${response.status}`);
  }

  private intoCandle(
    kline: unknown,
    symbol: string,
    timeframe: Timeframe,
    bucketMs: number,
  ): Candle {
    if (!Array.isArray(kline) || kline.length < 6 || typeof kline[0] !== 'number') {
      throw new MarketDataProviderUnavailableError(this.id, 'unexpected kline entry shape');
    }
    const openTimeMs = kline[0];

    return this.intoDomain(() =>
      createCandle({
        symbol,
        timeframe,
        openTime: new Date(openTimeMs).toISOString(),
        // Binance reports an inclusive close (open + tf − 1ms); the domain
        // convention is an exclusive bucket end (open + tf).
        closeTime: new Date(openTimeMs + bucketMs).toISOString(),
        open: Number(kline[1]),
        high: Number(kline[2]),
        low: Number(kline[3]),
        close: Number(kline[4]),
        volume: Number(kline[5]),
      }),
    );
  }

  /** A payload the domain factories reject is an unexpected upstream response. */
  private intoDomain<T>(build: () => T): T {
    try {
      return build();
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'invalid domain payload';
      throw new MarketDataProviderUnavailableError(
        this.id,
        `response violates contract: ${detail}`,
      );
    }
  }
}

/** AbortSignal.timeout aborts with a DOMException named TimeoutError. */
function isTimeoutError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    ((error as { name: string }).name === 'TimeoutError' ||
      (error as { name: string }).name === 'AbortError')
  );
}

async function readBinanceErrorCode(response: Response): Promise<number | null> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      typeof (body as { code?: unknown }).code === 'number'
    ) {
      return (body as { code: number }).code;
    }
  } catch {
    // Non-JSON error body — fall through to the generic mapping.
  }
  return null;
}
