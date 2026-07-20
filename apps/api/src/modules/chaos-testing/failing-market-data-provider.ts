import type { MarketDataProvider } from '../paper-trading-runner';

/**
 * Test double that injects deterministic MarketDataProvider failures (US199).
 */

export type FailingMarketDataProviderOptions<Candle> = Readonly<{
  delegate: MarketDataProvider<Candle>;
  failAfterCalls?: number;
  message?: string;
}>;

export class FailingMarketDataProvider<Candle> implements MarketDataProvider<Candle> {
  private readonly delegate: MarketDataProvider<Candle>;
  private readonly failAfterCalls: number;
  private readonly message: string;
  private calls = 0;
  readonly failureInjected: boolean[] = [];

  private constructor(options: FailingMarketDataProviderOptions<Candle>) {
    this.delegate = options.delegate;
    this.failAfterCalls = options.failAfterCalls ?? 0;
    this.message = options.message ?? 'chaos: market data provider failure';
  }

  static create<Candle>(
    options: FailingMarketDataProviderOptions<Candle>,
  ): FailingMarketDataProvider<Candle> {
    if (options.delegate === null || options.delegate === undefined) {
      throw new Error('delegate is required');
    }
    return new FailingMarketDataProvider(options);
  }

  next(): Promise<Candle | null> | Candle | null {
    const currentCalls = this.calls;
    this.calls += 1;

    if (currentCalls >= this.failAfterCalls) {
      this.failureInjected.push(true);
      throw new Error(this.message);
    }

    return this.delegate.next();
  }

  current(): Candle | null {
    return this.delegate.current();
  }

  reset(): void {
    this.calls = 0;
    this.failureInjected.length = 0;
    if (typeof (this.delegate as { reset?: () => void }).reset === 'function') {
      (this.delegate as { reset: () => void }).reset();
    }
  }
}
