import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { MarketDataCacheRegistry } from '../market-data-cache/market-data-cache-registry';
import { resolveMarketDataCacheConfig } from '../market-data-cache/market-data-cache.config';
import { MarketDataCacheService } from '../market-data-cache/market-data-cache.service';
import { MarketDataProviderRegistry } from '../market-data-domain/ports/market-data-provider-registry';
import { MockMarketDataProvider } from '../market-data-domain/providers/mock-market-data-provider';
import { InMemoryStrategyRepository } from '../strategies/repositories/in-memory-strategy.repository';
import { StrategyDomainService } from '../strategies/strategy-domain.service';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { DummyStrategyEvaluator } from './evaluators/dummy-strategy-evaluator';
import { SignalEvaluatorRegistry } from './signal-evaluator-registry';
import { SignalEngineController } from './signal-engine.controller';
import { SignalEngineService } from './signal-engine.service';
import { StrategyRunner } from './strategy-runner';

describe('SignalEngineController (US009)', () => {
  let controller: SignalEngineController;
  let strategies: StrategyDomainService;
  let workspaceId: string;
  let otherWorkspaceId: string;

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    strategies = new StrategyDomainService(new InMemoryStrategyRepository());

    const cache = new MarketDataCacheService(
      resolveMarketDataCacheConfig({
        enabled: undefined,
        tickerTtlSeconds: undefined,
        candlesTtlSeconds: undefined,
      }),
      new MarketDataCacheRegistry(),
    );
    const providers = new MarketDataProviderRegistry();
    providers.register(new MockMarketDataProvider());
    const evaluators = new SignalEvaluatorRegistry();
    evaluators.register(new DummyStrategyEvaluator());

    controller = new SignalEngineController(
      new SignalEngineService(strategies, cache, providers, new StrategyRunner(evaluators)),
      workspaces,
    );

    workspaceId = (await workspaces.create({ name: 'One', ownerUserId: 'user-1' })).id;
    otherWorkspaceId = (await workspaces.create({ name: 'Two', ownerUserId: 'user-2' })).id;
  });

  it('rejects a missing workspace header and an unknown workspace', async () => {
    await expect(controller.evaluate({ strategyId: 'x' }, undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(controller.evaluate({ strategyId: 'x' }, 'ws-unknown')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('evaluates a workspace strategy and returns the SignalResult', async () => {
    const strategy = await strategies.create({
      workspaceId,
      name: 'Momentum',
      tradingPair: 'BTCUSDT',
      timeframe: '1h',
      direction: 'BOTH',
    });

    const result = await controller.evaluate({ strategyId: strategy.id }, workspaceId);

    expect(result).toMatchObject({
      strategyId: strategy.id,
      symbol: 'BTCUSDT',
      timeframe: '1h',
    });
    expect(['BUY', 'SELL', 'HOLD']).toContain(result.signal);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(Number.isFinite(Date.parse(result.timestamp))).toBe(true);
  });

  it('returns 404 for unknown and foreign-workspace strategies', async () => {
    const strategy = await strategies.create({
      workspaceId,
      name: 'Mine',
      tradingPair: 'BTCUSDT',
      timeframe: '1h',
      direction: 'BOTH',
    });

    await expect(
      controller.evaluate({ strategyId: 'missing' }, workspaceId),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      controller.evaluate({ strategyId: strategy.id }, otherWorkspaceId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
