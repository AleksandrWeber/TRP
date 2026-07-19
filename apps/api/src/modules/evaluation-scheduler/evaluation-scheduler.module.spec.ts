import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { InMemoryStrategyRepository } from '../strategies/repositories/in-memory-strategy.repository';
import { STRATEGY_REPOSITORY } from '../strategies/repositories/strategy.repository.token';
import { StrategyDomainService } from '../strategies/strategy-domain.service';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WORKSPACE_REPOSITORY } from '../workspace/repositories/workspace.repository.token';
import { WorkspaceDomainService } from '../workspace';
import { SignalEngineService } from '../signal-engine';
import { MIN_EVALUATION_INTERVAL_MS } from './domain/evaluation-schedule';
import { EvaluationSchedulerModule } from './evaluation-scheduler.module';
import { EvaluationSchedulerService } from './evaluation-scheduler.service';

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
      EvaluationSchedulerModule,
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

describe('EvaluationSchedulerModule (US015)', () => {
  it('boots with the scheduler started', async () => {
    const moduleRef = await bootModule();
    const scheduler = moduleRef.get(EvaluationSchedulerService);

    expect(scheduler.isStarted()).toBe(true);

    await moduleRef.close();
  });

  it('wires schedule → SignalEngine end to end', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-19T15:00:00.000Z'));

    const moduleRef = await bootModule();
    const workspaces = moduleRef.get(WorkspaceDomainService);
    const strategies = moduleRef.get(StrategyDomainService);
    const scheduler = moduleRef.get(EvaluationSchedulerService);
    const engine = moduleRef.get(SignalEngineService);

    const workspace = await workspaces.create({
      name: 'Scheduler WS',
      ownerUserId: 'user-1',
    });
    const strategy = await strategies.create({
      workspaceId: workspace.id,
      name: 'Scheduled',
      tradingPair: 'BTCUSDT',
      timeframe: '1h',
      direction: 'BOTH',
    });

    const evaluateSpy = vi.spyOn(engine, 'evaluate');

    await scheduler.schedule(workspace.id, strategy.id, MIN_EVALUATION_INTERVAL_MS);
    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS);

    expect(evaluateSpy).toHaveBeenCalledWith(workspace.id, strategy.id);
    expect(['BUY', 'SELL', 'HOLD']).toContain(scheduler.get(workspace.id, strategy.id)?.lastSignal);

    await moduleRef.close();
    vi.useRealTimers();
  });
});
