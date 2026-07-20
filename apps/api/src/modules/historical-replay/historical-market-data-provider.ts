import type { MarketDataProvider } from '../paper-trading-runner';
import type { HistoricalCandle } from './historical-candle';
import type { HistoricalDataset } from './historical-dataset';
import { createReplayConfiguration, type ReplayConfiguration } from './replay-configuration';

/**
 * Deterministic historical candle feed for US193 Historical Replay.
 *
 * Implements MarketDataProvider and exposes initialize / hasNext /
 * isEndOfStream. Never mutates the underlying HistoricalDataset.
 */

export type HistoricalMarketDataProviderDependencies = Readonly<{
  dataset: HistoricalDataset | null;
  configuration?: ReplayConfiguration;
}>;

export class HistoricalMarketDataProvider implements MarketDataProvider<HistoricalCandle> {
  private readonly dataset: HistoricalDataset;
  private readonly configuration: ReplayConfiguration;
  private readonly window: readonly HistoricalCandle[];
  private cursor: number;
  private currentCandle: HistoricalCandle | null;
  private initialized: boolean;

  private constructor(dataset: HistoricalDataset, configuration: ReplayConfiguration) {
    this.dataset = dataset;
    this.configuration = configuration;
    this.window = Object.freeze(
      dataset.candles.slice(configuration.startIndex, configuration.endIndex + 1),
    );
    this.cursor = 0;
    this.currentCandle = null;
    this.initialized = false;
  }

  static create(
    dependencies: HistoricalMarketDataProviderDependencies,
  ): HistoricalMarketDataProvider {
    if (dependencies.dataset === null || dependencies.dataset === undefined) {
      throw new Error('dataset is required');
    }

    const dataset = dependencies.dataset;
    const configuration =
      dependencies.configuration ??
      createReplayConfiguration({
        datasetId: dataset.datasetId,
        endIndex: dataset.candles.length - 1,
      });

    if (configuration.datasetId !== dataset.datasetId) {
      throw new Error(`replay configuration datasetId mismatch: ${configuration.datasetId}`);
    }
    if (configuration.endIndex >= dataset.candles.length) {
      throw new Error(
        `endIndex out of range: ${configuration.endIndex} >= ${dataset.candles.length}`,
      );
    }
    if (configuration.startIndex >= dataset.candles.length) {
      throw new Error(
        `startIndex out of range: ${configuration.startIndex} >= ${dataset.candles.length}`,
      );
    }

    return new HistoricalMarketDataProvider(dataset, configuration);
  }

  initialize(): void {
    this.cursor = 0;
    this.currentCandle = null;
    this.initialized = true;
  }

  next(): HistoricalCandle | null {
    this.ensureInitialized();
    if (this.cursor >= this.window.length) {
      this.currentCandle = null;
      return null;
    }
    const candle = this.window[this.cursor] as HistoricalCandle;
    this.cursor += 1;
    this.currentCandle = candle;
    return candle;
  }

  current(): HistoricalCandle | null {
    return this.currentCandle;
  }

  hasNext(): boolean {
    this.ensureInitialized();
    return this.cursor < this.window.length;
  }

  reset(): void {
    this.cursor = 0;
    this.currentCandle = null;
  }

  isEndOfStream(): boolean {
    this.ensureInitialized();
    return this.cursor >= this.window.length;
  }

  datasetId(): string {
    return this.dataset.datasetId;
  }

  replayConfiguration(): ReplayConfiguration {
    return this.configuration;
  }

  sourceDataset(): HistoricalDataset {
    return this.dataset;
  }

  size(): number {
    return this.window.length;
  }

  remaining(): number {
    return Math.max(0, this.window.length - this.cursor);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }
}
