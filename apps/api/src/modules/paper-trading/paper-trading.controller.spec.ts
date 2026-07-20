import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import type { TradeResult } from './domain/trade-result';
import { PaperTradingController } from './paper-trading.controller';
import type { PaperTradingService } from './paper-trading.service';

const RESULT: TradeResult = {
  positionId: 'position-1',
  action: 'OPEN_LONG',
  price: 100,
  quantity: 1,
  realizedPnL: 0,
  timestamp: '2026-01-01T00:00:00.000Z',
};

describe('PaperTradingController (US010)', () => {
  let controller: PaperTradingController;
  let workspaceId: string;
  let result: TradeResult | null;

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    workspaceId = (await workspaces.create({ name: 'One', ownerUserId: 'user-1' })).id;
    result = RESULT;
    const service = {
      execute: async () => result,
      listPositions: () => [],
      listHistory: () => [],
      portfolio: async () => ({
        realizedPnL: 0,
        unrealizedPnL: 0,
        totalPnL: 0,
        openPositions: 0,
        closedPositions: 0,
        positions: [],
        generatedAt: '2026-01-01T00:00:00.000Z',
      }),
    } as unknown as PaperTradingService;
    controller = new PaperTradingController(service, workspaces);
  });

  it('requires a valid workspace on every route', async () => {
    await expect(controller.execute({ strategyId: 'strategy-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(() => controller.positions('unknown')).toThrow(NotFoundException);
    expect(() => controller.history(undefined)).toThrow(BadRequestException);
    expect(() => controller.portfolio('unknown')).toThrow(NotFoundException);
  });

  it('returns the manual execution result', async () => {
    await expect(controller.execute({ strategyId: 'strategy-1' }, workspaceId)).resolves.toEqual(
      RESULT,
    );
  });

  it('returns 404 when the strategy is absent from the workspace', async () => {
    result = null;
    await expect(controller.execute({ strategyId: 'missing' }, workspaceId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('exposes positions, history, and portfolio', async () => {
    expect(controller.positions(workspaceId)).toEqual([]);
    expect(controller.history(workspaceId)).toEqual([]);
    await expect(controller.portfolio(workspaceId)).resolves.toMatchObject({
      totalPnL: 0,
      openPositions: 0,
    });
  });
});
