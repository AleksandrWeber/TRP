import { describe, expect, it } from 'vitest';
import { MarketDataCacheRegistry } from '../market-data-cache/market-data-cache-registry';
import { resolveMarketDataCacheConfig } from '../market-data-cache/market-data-cache.config';
import { MarketDataCacheService } from '../market-data-cache/market-data-cache.service';
import { Timeframe } from '../market-data-domain/domain/timeframe';
import type { MarketDataProvider } from '../market-data-domain/ports/market-data-provider';
import { MarketDataProviderRegistry } from '../market-data-domain/ports/market-data-provider-registry';
import { MockMarketDataProvider } from '../market-data-domain/providers/mock-market-data-provider';
import { InMemoryStrategyRepository } from '../strategies/repositories/in-memory-strategy.repository';
import { StrategyDomainService } from '../strategies/strategy-domain.service';
import { EmptyCandleSeriesError } from './domain/signal-engine.error';
import { DummyStrategyEvaluator } from './evaluators/dummy-strategy-evaluator';
import { SignalEvaluatorRegistry } from './signal-evaluator-registry';
import { SIGNAL_CANDLES_LIMIT, SignalEngineService } from './signal-engine.service';
import { StrategyRunner } from './strategy-runner';

const WORKSPACE_ID = 'ws-1';

type Harness = {
  engine: SignalEngineService;
  strategies: StrategyDomainService;
  cache: MarketDataCacheService;
  providers: MarketDataProviderRegistry;
};

function buildHarness(provider: MarketDataProvider = new MockMarketDataProvider()): Harness {
  const strategies = new StrategyDomainService(new InMemoryStrategyRepository());
  const cache = new MarketDataCacheService(
    resolveMarketDataCacheConfig({
      enabled: undefined,
      tickerTtlSeconds: undefined,
      candlesTtlSeconds: undefined,
    }),
    new MarketDataCacheRegistry(),
  );
  const providers = new MarketDataProviderRegistry();
  providers.register(provider);

  const evaluators = new SignalEvaluatorRegistry();
  evaluators.register(new DummyStrategyEvaluator());

  const engine = new SignalEngineService(
    strategies,
    cache,
    providers,
    new StrategyRunner(evaluators),
  );
  return { engine, strategies, cache, providers };
}

async function createStrategy(strategies: StrategyDomainService) {
  return strategies.create({
    workspaceId: WORKSPACE_ID,
    name: 'Momentum',
    tradingPair: 'BTCUSDT',
    timeframe: '1h',
    direction: 'BOTH',
  });
}

describe('SignalEngineService (US009)', () => {
  it('evaluates a strategy into a deterministic SignalResult', async () => {
    const { engine, strategies } = buildHarness();
    const strategy = await createStrategy(strategies);

    const result = await engine.evaluate(WORKSPACE_ID, strategy.id);

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      strategyId: strategy.id,
      symbol: 'BTCUSDT',
      timeframe: Timeframe.H1,
    });
    expect(['BUY', 'SELL']).toContain(result?.signal);
    expect(result?.metadata).toMatchObject({
      evaluator: 'dummy',
      candlesEvaluated: SIGNAL_CANDLES_LIMIT,
    });

    // Mock provider is deterministic → identical decision on re-evaluation.
    const again = await engine.evaluate(WORKSPACE_ID, strategy.id);
    expect(again?.signal).toBe(result?.signal);
    expect(again?.confidence).toBe(result?.confidence);
  });

  it('returns null for a missing or foreign-workspace strategy', async () => {
    const { engine, strategies } = buildHarness();
    const strategy = await createStrategy(strategies);

    expect(await engine.evaluate(WORKSPACE_ID, 'missing')).toBeNull();
    expect(await engine.evaluate('ws-other', strategy.id)).toBeNull();
  });

  it('reads candles through the cache — the second evaluation triggers no provider call', async () => {
    const { engine, strategies, cache } = buildHarness();
    const strategy = await createStrategy(strategies);

    await engine.evaluate(WORKSPACE_ID, strategy.id);
    expect(cache.stats()).toMatchObject({ misses: 1, providerCalls: 1 });

    await engine.evaluate(WORKSPACE_ID, strategy.id);
    expect(cache.stats()).toMatchObject({ hits: 1, misses: 1, providerCalls: 1 });
  });

  it('shares cache entries with the market candles endpoint key format', async () => {
    const { engine, strategies, cache, providers } = buildHarness();
    const strategy = await createStrategy(strategies);

    // Warm the cache exactly like the market controller would.
    await cache.getCandles('BTCUSDT', Timeframe.H1, SIGNAL_CANDLES_LIMIT, () =>
      providers.getActive().getCandles('BTCUSDT', Timeframe.H1, SIGNAL_CANDLES_LIMIT),
    );

    await engine.evaluate(WORKSPACE_ID, strategy.id);
    expect(cache.stats()).toMatchObject({ hits: 1, misses: 1, providerCalls: 1 });
  });

  it('throws EmptyCandleSeriesError when the pipeline yields no candles', async () => {
    const empty: MarketDataProvider = {
      id: 'empty',
      getTicker: async () => {
        throw new Error('not used');
      },
      getCandles: async () => [],
      health: async () => ({ providerId: 'empty', status: 'ok', detail: '' }),
    };
    const { engine, strategies } = buildHarness(empty);
    const strategy = await createStrategy(strategies);

    await expect(engine.evaluate(WORKSPACE_ID, strategy.id)).rejects.toBeInstanceOf(
      EmptyCandleSeriesError,
    );
  });
});
