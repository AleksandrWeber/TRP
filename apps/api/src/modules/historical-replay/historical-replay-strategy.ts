import type {
  MarketDataProvider,
  PaperExecutionContext,
  PaperStrategy,
} from '../paper-trading-runner';
import type { HistoricalCandle } from './historical-candle';

/**
 * Invocation-recording strategy for US193 Historical Replay.
 *
 * Consumes one historical candle per execute cycle. Never creates orders,
 * signals, positions, or portfolio updates.
 */

export type HistoricalReplayStrategyDependencies = Readonly<{
  marketDataProvider: MarketDataProvider<HistoricalCandle> | null;
}>;

export class HistoricalReplayStrategy implements PaperStrategy {
  private readonly marketDataProvider: MarketDataProvider<HistoricalCandle>;
  readonly initializeCalls: PaperExecutionContext[] = [];
  readonly executeCalls: PaperExecutionContext[] = [];
  readonly shutdownCalls: PaperExecutionContext[] = [];
  readonly consumedCandles: Array<HistoricalCandle | null> = [];
  readonly invocations: Array<'initialize' | 'execute' | 'shutdown'> = [];

  private constructor(marketDataProvider: MarketDataProvider<HistoricalCandle>) {
    this.marketDataProvider = marketDataProvider;
  }

  static create(dependencies: HistoricalReplayStrategyDependencies): HistoricalReplayStrategy {
    if (dependencies.marketDataProvider === null || dependencies.marketDataProvider === undefined) {
      throw new Error('marketDataProvider is required');
    }
    return new HistoricalReplayStrategy(dependencies.marketDataProvider);
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
