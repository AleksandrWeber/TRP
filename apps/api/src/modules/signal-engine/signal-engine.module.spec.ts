import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { InMemoryStrategyRepository } from '../strategies/repositories/in-memory-strategy.repository';
import { STRATEGY_REPOSITORY } from '../strategies/repositories/strategy.repository.token';
import { StrategyDomainService } from '../strategies/strategy-domain.service';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WORKSPACE_REPOSITORY } from '../workspace/repositories/workspace.repository.token';
import { SignalEngineModule } from './signal-engine.module';
import { SignalEngineService } from './signal-engine.service';
import { SignalEvaluatorRegistry } from './signal-evaluator-registry';

const ORIGINAL_PROVIDER = process.env.MARKET_DATA_PROVIDER;

afterEach(() => {
  if (ORIGINAL_PROVIDER === undefined) {
    delete process.env.MARKET_DATA_PROVIDER;
  } else {
    process.env.MARKET_DATA_PROVIDER = ORIGINAL_PROVIDER;
  }
});

async function bootModule() {
  // Deterministic mock provider — the DI test must not depend on Binance.
  process.env.MARKET_DATA_PROVIDER = 'mock';

  const moduleRef = await Test.createTestingModule({
    // Mirrors AppModule: a global ConfigModule provides ConfigService.
    imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), SignalEngineModule],
  })
    // In-memory persistence — no database in unit tests.
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(STRATEGY_REPOSITORY)
    .useValue(new InMemoryStrategyRepository())
    .overrideProvider(WORKSPACE_REPOSITORY)
    .useValue(new InMemoryWorkspaceRepository())
    .compile();

  await moduleRef.init();
  return moduleRef;
}

describe('SignalEngineModule (US009)', () => {
  it('boots with the dummy evaluator registered as default', async () => {
    const moduleRef = await bootModule();

    const registry = moduleRef.get(SignalEvaluatorRegistry);
    expect(registry.list()).toEqual(['dummy']);
    expect(registry.resolve().id).toBe('dummy');

    await moduleRef.close();
  });

  it('wires the engine end to end: strategy → cache → evaluator → SignalResult', async () => {
    const moduleRef = await bootModule();

    const strategies = moduleRef.get(StrategyDomainService);
    const engine = moduleRef.get(SignalEngineService);

    const strategy = await strategies.create({
      workspaceId: 'ws-1',
      name: 'Momentum',
      tradingPair: 'BTCUSDT',
      timeframe: '1h',
      direction: 'BOTH',
    });

    const result = await engine.evaluate('ws-1', strategy.id);
    expect(result).toMatchObject({ strategyId: strategy.id, symbol: 'BTCUSDT', timeframe: '1h' });
    expect(['BUY', 'SELL']).toContain(result?.signal);

    await moduleRef.close();
  });
});
