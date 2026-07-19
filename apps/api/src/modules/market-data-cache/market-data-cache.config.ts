/**
 * Market Data Cache configuration (US008).
 * Env-driven, validated at bootstrap — an invalid value fails fast instead of
 * silently running with a wrong TTL (same policy as MARKET_DATA_PROVIDER).
 */

export const MARKET_CACHE_ENABLED_ENV_VAR = 'MARKET_CACHE_ENABLED';
export const MARKET_CACHE_TICKER_TTL_ENV_VAR = 'MARKET_CACHE_TICKER_TTL';
export const MARKET_CACHE_CANDLES_TTL_ENV_VAR = 'MARKET_CACHE_CANDLES_TTL';

export const DEFAULT_MARKET_CACHE_ENABLED = true;
/** Seconds. */
export const DEFAULT_MARKET_CACHE_TICKER_TTL = 5;
/** Seconds. */
export const DEFAULT_MARKET_CACHE_CANDLES_TTL = 60;

/** Nest DI token for the resolved MarketDataCacheConfig. */
export const MARKET_DATA_CACHE_CONFIG = Symbol('MARKET_DATA_CACHE_CONFIG');

export type MarketDataCacheConfig = Readonly<{
  enabled: boolean;
  tickerTtlMs: number;
  candlesTtlMs: number;
}>;

export type RawMarketDataCacheEnv = Readonly<{
  enabled: string | undefined;
  tickerTtlSeconds: string | undefined;
  candlesTtlSeconds: string | undefined;
}>;

export function resolveMarketDataCacheConfig(raw: RawMarketDataCacheEnv): MarketDataCacheConfig {
  return Object.freeze({
    enabled: parseEnabled(raw.enabled),
    tickerTtlMs:
      parseTtlSeconds(
        MARKET_CACHE_TICKER_TTL_ENV_VAR,
        raw.tickerTtlSeconds,
        DEFAULT_MARKET_CACHE_TICKER_TTL,
      ) * 1000,
    candlesTtlMs:
      parseTtlSeconds(
        MARKET_CACHE_CANDLES_TTL_ENV_VAR,
        raw.candlesTtlSeconds,
        DEFAULT_MARKET_CACHE_CANDLES_TTL,
      ) * 1000,
  });
}

function parseEnabled(raw: string | undefined): boolean {
  const value = (raw ?? '').trim().toLowerCase();
  if (value === '') {
    return DEFAULT_MARKET_CACHE_ENABLED;
  }
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  throw new Error(
    `Invalid ${MARKET_CACHE_ENABLED_ENV_VAR} '${raw}' — expected true | false | 1 | 0`,
  );
}

function parseTtlSeconds(envVar: string, raw: string | undefined, fallback: number): number {
  const value = (raw ?? '').trim();
  if (value === '') {
    return fallback;
  }
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`Invalid ${envVar} '${raw}' — expected a positive number of seconds`);
  }
  return seconds;
}
