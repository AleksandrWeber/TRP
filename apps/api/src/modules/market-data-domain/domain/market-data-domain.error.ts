export const MARKET_DATA_DOMAIN_ERROR_CODES = [
  'UNSUPPORTED_SYMBOL',
  'UNSUPPORTED_TIMEFRAME',
  'PROVIDER_UNAVAILABLE',
  'PROVIDER_TIMEOUT',
] as const;
export type MarketDataDomainErrorCode = (typeof MARKET_DATA_DOMAIN_ERROR_CODES)[number];

/**
 * Canonical error boundary of the Market Data Domain (US007).
 * Providers must convert every implementation failure (HTTP status, timeout,
 * malformed payload, exchange error code) into one of these errors so that
 * provider-internal details never cross the port boundary.
 */
export abstract class MarketDataDomainError extends Error {
  abstract readonly code: MarketDataDomainErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** The requested symbol is malformed or not tradable on the active provider. */
export class UnsupportedMarketSymbolError extends MarketDataDomainError {
  readonly code = 'UNSUPPORTED_SYMBOL' as const;

  constructor(symbol: string, providerId: string) {
    super(`Symbol not supported by market data provider '${providerId}': ${symbol}`);
  }
}

/** The requested timeframe cannot be served by the active provider. */
export class UnsupportedMarketTimeframeError extends MarketDataDomainError {
  readonly code = 'UNSUPPORTED_TIMEFRAME' as const;

  constructor(timeframe: string, providerId: string) {
    super(`Timeframe not supported by market data provider '${providerId}': ${timeframe}`);
  }
}

/** Upstream HTTP failure, rate limit, or a payload that violates the contract. */
export class MarketDataProviderUnavailableError extends MarketDataDomainError {
  readonly code = 'PROVIDER_UNAVAILABLE' as const;

  constructor(providerId: string, detail: string) {
    super(`Market data provider '${providerId}' unavailable: ${detail}`);
  }
}

/** Upstream did not answer within the configured timeout. */
export class MarketDataProviderTimeoutError extends MarketDataDomainError {
  readonly code = 'PROVIDER_TIMEOUT' as const;

  constructor(providerId: string, timeoutMs: number) {
    super(`Market data provider '${providerId}' timed out after ${timeoutMs}ms`);
  }
}
