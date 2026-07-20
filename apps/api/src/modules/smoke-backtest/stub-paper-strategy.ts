import type {
  MarketDataProvider,
  PaperExecutionContext,
  PaperStrategy,
} from '../paper-trading-runner';
import type { SmokeCandle } from './stub-market-data-provider';

/**
 * Invocation-recording strategy stub for the US191 Smoke Backtest.
 *
 * Never creates orders, signals, positions, or portfolio updates.
 */

export type StubPaperStrategyDependencies = Readonly<{
  marketDataProvider: MarketDataProvider<SmokeCandle> | null;
}>;

export class StubPaperStrategy implements PaperStrategy {
  private readonly marketDataProvider: MarketDataProvider<SmokeCandle>;
  readonly initializeCalls: PaperExecutionContext[] = [];
  readonly executeCalls: PaperExecutionContext[] = [];
  readonly shutdownCalls: PaperExecutionContext[] = [];
  readonly consumedCandles: Array<SmokeCandle | null> = [];
  readonly invocations: Array<'initialize' | 'execute' | 'shutdown'> = [];

  private constructor(marketDataProvider: MarketDataProvider<SmokeCandle>) {
    this.marketDataProvider = marketDataProvider;
  }

  static create(dependencies: StubPaperStrategyDependencies): StubPaperStrategy {
    if (dependencies.marketDataProvider === null || dependencies.marketDataProvider === undefined) {
      throw new Error('marketDataProvider is required');
    }
    return new StubPaperStrategy(dependencies.marketDataProvider);
  }

  initialize(context: PaperExecutionContext): void {
    this.invocations.push('initialize');
    this.initializeCalls.push(context);
  }

  async execute(context: PaperExecutionContext): Promise<void> {
    this.invocations.push('execute');
    this.executeCalls.push(context);
    const candle = await Promise.resolve(this.marketDataProvider.next());
    this.consumedCandles.push(candle);
  }

  shutdown(context: PaperExecutionContext): void {
    this.invocations.push('shutdown');
    this.shutdownCalls.push(context);
  }
}
