import { Inject, Injectable } from '@nestjs/common';
import { MarketDataCacheService } from '../market-data-cache/market-data-cache.service';
import type { Timeframe } from '../market-data-domain/domain/timeframe';
import { MarketDataProviderRegistry } from '../market-data-domain/ports/market-data-provider-registry';
import { StrategyDomainService } from '../strategies';
import { EmptyCandleSeriesError } from './domain/signal-engine.error';
import type { SignalResult } from './domain/signal-result';
import { StrategyRunner } from './strategy-runner';

/**
 * Candle window requested per evaluation. Matches the market controller's
 * DEFAULT_CANDLES_LIMIT so both consumers share the same cache entries
 * (key: candles:<symbol>:<timeframe>:<limit>).
 */
export const SIGNAL_CANDLES_LIMIT = 100;

/**
 * Signal Engine orchestrator (US009).
 * evaluate(): load the workspace-scoped strategy → request the cached candle
 * window → delegate to the StrategyRunner → return the SignalResult.
 *
 * Market data is read exclusively through MarketDataCacheService (US008);
 * the provider registry appears only inside the cache-miss loader — the
 * engine never talks to Binance (or any provider) directly, and a warm cache
 * serves evaluations without any provider call. On-request only: no
 * scheduling, no polling, no persistence, no order execution.
 */
@Injectable()
export class SignalEngineService {
  constructor(
    // Explicit tokens — vitest (esbuild) emits no design:paramtypes metadata.
    @Inject(StrategyDomainService) private readonly strategies: StrategyDomainService,
    @Inject(MarketDataCacheService) private readonly cache: MarketDataCacheService,
    @Inject(MarketDataProviderRegistry) private readonly providers: MarketDataProviderRegistry,
    @Inject(StrategyRunner) private readonly runner: StrategyRunner,
  ) {}

  /** Returns null when the strategy does not exist in the workspace (→ 404). */
  async evaluate(workspaceId: string, strategyId: string): Promise<SignalResult | null> {
    const strategy = await this.strategies.getById(workspaceId, strategyId);
    if (!strategy) return null;

    const symbol = strategy.tradingPair;
    // Same literal values; the runner's createSignalResult re-validates.
    const timeframe = strategy.timeframe as Timeframe;

    const candles = await this.cache.getCandles(symbol, timeframe, SIGNAL_CANDLES_LIMIT, () =>
      this.providers.getActive().getCandles(symbol, timeframe, SIGNAL_CANDLES_LIMIT),
    );
    if (candles.length === 0) {
      throw new EmptyCandleSeriesError(symbol, timeframe);
    }

    return this.runner.run(strategy, candles);
  }
}
