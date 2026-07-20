import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { InMemoryStrategyRepository } from '../strategies/repositories/in-memory-strategy.repository';
import { STRATEGY_REPOSITORY } from '../strategies/repositories/strategy.repository.token';
import { StrategyDomainService } from '../strategies/strategy-domain.service';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WORKSPACE_REPOSITORY } from '../workspace/repositories/workspace.repository.token';
import { PaperTradingModule } from './paper-trading.module';
import { PaperTradingService } from './paper-trading.service';
import { PositionRegistry } from './position-registry';
import { TradeHistory } from './trade-history';

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
    imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), PaperTradingModule],
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

describe('PaperTradingModule (US010)', () => {
  it('boots with isolated empty in-memory state', async () => {
    const moduleRef = await bootModule();

    expect(moduleRef.get(PositionRegistry).list('ws-1')).toEqual([]);
    expect(moduleRef.get(TradeHistory).list('ws-1')).toEqual([]);
    await expect(moduleRef.get(PaperTradingService).portfolio('ws-1')).resolves.toMatchObject({
      totalPnL: 0,
      openPositions: 0,
    });

    await moduleRef.close();
  });

  it('wires strategy → signal → cached ticker → paper execution', async () => {
    const moduleRef = await bootModule();
    const strategy = await moduleRef.get(StrategyDomainService).create({
      workspaceId: 'ws-1',
      name: 'Paper',
      tradingPair: 'BTCUSDT',
      timeframe: '1h',
      direction: 'BOTH',
      positionSize: 2,
    });

    const result = await moduleRef.get(PaperTradingService).execute('ws-1', strategy.id);
    expect(result).toMatchObject({
      price: expect.any(Number),
      timestamp: expect.any(String),
    });
    expect(['OPEN_LONG', 'IGNORED']).toContain(result?.action);

    await moduleRef.close();
  });
});
