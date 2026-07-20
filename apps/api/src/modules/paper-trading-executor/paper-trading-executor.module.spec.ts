import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { EvaluationSchedulerService } from '../evaluation-scheduler';
import { MIN_EVALUATION_INTERVAL_MS } from '../evaluation-scheduler/domain/evaluation-schedule';
import { InMemoryStrategyRepository } from '../strategies/repositories/in-memory-strategy.repository';
import { STRATEGY_REPOSITORY } from '../strategies/repositories/strategy.repository.token';
import { StrategyDomainService } from '../strategies/strategy-domain.service';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WORKSPACE_REPOSITORY } from '../workspace/repositories/workspace.repository.token';
import { WorkspaceDomainService } from '../workspace';
import { ExecutorPortfolioStore } from './executor-portfolio-store';
import { PaperTradingExecutorModule } from './paper-trading-executor.module';
import { PaperTradingExecutorService } from './paper-trading-executor.service';

const ORIGINAL_PROVIDER = process.env.MARKET_DATA_PROVIDER;

afterEach(() => {
  if (ORIGINAL_PROVIDER === undefined) {
    delete process.env.MARKET_DATA_PROVIDER;
  } else {
    process.env.MARKET_DATA_PROVIDER = ORIGINAL_PROVIDER;
  }
});

async function bootModule() {
  process.env.MARKET_DATA_PROVIDER = 'mock';

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      PaperTradingExecutorModule,
    ],
  })
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

describe('PaperTradingExecutorModule (US016)', () => {
  it('boots with empty executor state', async () => {
    const moduleRef = await bootModule();

    expect(moduleRef.get(ExecutorPortfolioStore).listTrades('ws-1')).toEqual([]);
    await expect(
      moduleRef.get(PaperTradingExecutorService).listPortfolios('ws-1'),
    ).resolves.toEqual([]);

    await moduleRef.close();
  });

  it('wires scheduler tick → signal → paper execution end to end', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-19T15:00:00.000Z'));

    const moduleRef = await bootModule();
    const workspaces = moduleRef.get(WorkspaceDomainService);
    const strategies = moduleRef.get(StrategyDomainService);
    const scheduler = moduleRef.get(EvaluationSchedulerService);
    const executor = moduleRef.get(PaperTradingExecutorService);

    const workspace = await workspaces.create({
      name: 'Executor WS',
      ownerUserId: 'user-1',
    });
    const strategy = await strategies.create({
      workspaceId: workspace.id,
      name: 'Executed',
      tradingPair: 'BTCUSDT',
      timeframe: '1h',
      direction: 'BOTH',
      positionSize: 1,
    });

    await scheduler.schedule(workspace.id, strategy.id, MIN_EVALUATION_INTERVAL_MS);
    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS);

    // The mock provider + dummy evaluator produce BUY or SELL; either way the
    // executor must have processed exactly one signal for this strategy.
    const portfolio = await executor.getPortfolio(workspace.id, strategy.id);
    const processed =
      portfolio.signalStats.buy + portfolio.signalStats.sell + portfolio.signalStats.hold;
    expect(processed).toBe(1);

    if (portfolio.signalStats.buy === 1) {
      expect(portfolio.currentPosition).toMatchObject({
        strategyId: strategy.id,
        symbol: 'BTCUSDT',
        status: 'OPEN',
      });
      expect(executor.listTrades(workspace.id, strategy.id)).toHaveLength(1);
    } else {
      // First SELL with no open position is ignored — no trade, only stats.
      expect(portfolio.currentPosition).toBeNull();
      expect(executor.listTrades(workspace.id, strategy.id)).toHaveLength(0);
    }

    await moduleRef.close();
    vi.useRealTimers();
  });
});
