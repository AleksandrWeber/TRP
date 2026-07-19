/**
 * Nest DI token for the active live MarketDataProvider (US006).
 * Consumers inject this token and depend only on the interface.
 */
export const MARKET_DATA_PROVIDER = Symbol('MARKET_DATA_PROVIDER');
