/**
 * Contract for the market data feed consumed by future paper trading
 * executions.
 *
 * US189 defines the contract only. The Runner performs no market
 * simulation and never consumes market data itself.
 */
export interface MarketDataProvider<TSample = unknown> {
  next(): Promise<TSample | null> | TSample | null;
  current(): TSample | null;
  reset(): Promise<void> | void;
}
