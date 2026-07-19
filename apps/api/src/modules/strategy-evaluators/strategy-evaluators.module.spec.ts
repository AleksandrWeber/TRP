import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { SignalEngineService, SignalEvaluatorRegistry } from '../signal-engine';
import { InMemoryStrategyRepository } from '../strategies/repositories/in-memory-strategy.repository';
import { STRATEGY_REPOSITORY } from '../strategies/repositories/strategy.repository.token';
import { StrategyDomainService } from '../strategies/strategy-domain.service';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WORKSPACE_REPOSITORY } from '../workspace/repositories/workspace.repository.token';
import { StrategyEvaluatorsModule } from './strategy-evaluators.module';

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
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      StrategyEvaluatorsModule,
    ],
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

describe('StrategyEvaluatorsModule (US012)', () => {
  it('registers sma and ema after the dummy default', async () => {
    const moduleRef = await bootModule();

    const registry = moduleRef.get(SignalEvaluatorRegistry);
    expect(registry.list()).toEqual(['dummy', 'sma', 'ema']);
    // The dummy stays the default — US009 behaviour is untouched.
    expect(registry.resolve().id).toBe('dummy');

    await moduleRef.close();
  });

  it('evaluates an SMA strategy end to end through the signal engine', async () => {
    const moduleRef = await bootModule();

    const strategies = moduleRef.get(StrategyDomainService);
    const engine = moduleRef.get(SignalEngineService);

    const strategy = await strategies.create({
      workspaceId: 'ws-1',
      name: 'SMA cross',
      tradingPair: 'BTCUSDT',
      timeframe: '1h',
      direction: 'BOTH',
      parameters: { evaluator: 'sma', period: 20 },
    });

    const result = await engine.evaluate('ws-1', strategy.id);
    expect(result).toMatchObject({ strategyId: strategy.id, symbol: 'BTCUSDT' });
    expect(['BUY', 'SELL']).toContain(result?.signal);
    expect(result?.metadata).toMatchObject({ evaluator: 'sma', indicator: 'sma', period: 20 });

    await moduleRef.close();
  });

  it('evaluates an EMA strategy end to end through the signal engine', async () => {
    const moduleRef = await bootModule();

    const strategies = moduleRef.get(StrategyDomainService);
    const engine = moduleRef.get(SignalEngineService);

    const strategy = await strategies.create({
      workspaceId: 'ws-1',
      name: 'EMA cross',
      tradingPair: 'ETHUSDT',
      timeframe: '1h',
      direction: 'BOTH',
      parameters: { evaluator: 'ema', period: 10 },
    });

    const result = await engine.evaluate('ws-1', strategy.id);
    expect(['BUY', 'SELL']).toContain(result?.signal);
    expect(result?.metadata).toMatchObject({ evaluator: 'ema', indicator: 'ema', period: 10 });

    await moduleRef.close();
  });

  it('keeps the dummy evaluator working unchanged (regression)', async () => {
    const moduleRef = await bootModule();

    const strategies = moduleRef.get(StrategyDomainService);
    const engine = moduleRef.get(SignalEngineService);

    const strategy = await strategies.create({
      workspaceId: 'ws-1',
      name: 'Dummy',
      tradingPair: 'BTCUSDT',
      timeframe: '1h',
      direction: 'BOTH',
    });

    const result = await engine.evaluate('ws-1', strategy.id);
    expect(['BUY', 'SELL']).toContain(result?.signal);
    expect(result?.metadata).toMatchObject({ evaluator: 'dummy' });

    await moduleRef.close();
  });
});
