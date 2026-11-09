import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
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

function request(userId: string, role: Role = Role.Trader): { user: AuthUser } {
  return {
    user: { userId, email: `${userId}@trp.local`, displayName: userId, role },
  };
}

describe('PaperTradingController (US010)', () => {
  let controller: PaperTradingController;
  let workspaceId: string;
  let result: TradeResult | null;
  const execute = vi.fn(async () => result);
  const listPositions = vi.fn(() => []);
  const listHistory = vi.fn(() => []);
  const portfolio = vi.fn(async () => ({
    realizedPnL: 0,
    unrealizedPnL: 0,
    totalPnL: 0,
    openPositions: 0,
    closedPositions: 0,
    positions: [],
    generatedAt: '2026-01-01T00:00:00.000Z',
  }));

  beforeEach(async () => {
    execute.mockClear();
    listPositions.mockClear();
    listHistory.mockClear();
    portfolio.mockClear();
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    workspaceId = (await workspaces.create({ name: 'One', ownerUserId: 'user-1' })).id;
    result = RESULT;
    const service = {
      execute,
      listPositions,
      listHistory,
      portfolio,
    } as unknown as PaperTradingService;
    controller = new PaperTradingController(
      service,
      workspaces,
      new WorkspaceAccessService(workspaces),
    );
  });

  it('requires a valid workspace on every route', async () => {
    const owner = request('user-1');
    await expect(controller.execute(owner, { strategyId: 'strategy-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(() => controller.positions(owner, 'unknown')).toThrow(NotFoundException);
    expect(() => controller.history(owner, undefined)).toThrow(BadRequestException);
    expect(() => controller.portfolio(owner, 'unknown')).toThrow(NotFoundException);
    expect(execute).not.toHaveBeenCalled();
    expect(listPositions).not.toHaveBeenCalled();
    expect(listHistory).not.toHaveBeenCalled();
    expect(portfolio).not.toHaveBeenCalled();
  });

  it('returns the manual execution result for the workspace owner', async () => {
    await expect(
      controller.execute(request('user-1'), { strategyId: 'strategy-1' }, workspaceId),
    ).resolves.toEqual(RESULT);
    expect(execute).toHaveBeenCalledWith(workspaceId, 'strategy-1');
  });

  it('returns 404 when the strategy is absent from the workspace', async () => {
    result = null;
    await expect(
      controller.execute(request('user-1'), { strategyId: 'missing' }, workspaceId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(execute).toHaveBeenCalledOnce();
  });

  it('exposes positions, history, and portfolio to the owner', async () => {
    const owner = request('user-1');
    expect(controller.positions(owner, workspaceId)).toEqual([]);
    expect(controller.history(owner, workspaceId)).toEqual([]);
    await expect(controller.portfolio(owner, workspaceId)).resolves.toMatchObject({
      totalPnL: 0,
      openPositions: 0,
    });
  });

  it.each([
    [
      'execute',
      (actor: { user: AuthUser }) => controller.execute(actor, { strategyId: 's' }, workspaceId),
      execute,
    ],
    [
      'positions',
      (actor: { user: AuthUser }) => controller.positions(actor, workspaceId),
      listPositions,
    ],
    ['history', (actor: { user: AuthUser }) => controller.history(actor, workspaceId), listHistory],
    [
      'portfolio',
      (actor: { user: AuthUser }) => controller.portfolio(actor, workspaceId),
      portfolio,
    ],
  ] as const)('denies non-owner and non-owner Admin before %s', async (_name, call, spy) => {
    spy.mockClear();
    await expect(Promise.resolve().then(() => call(request('other')))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(spy).not.toHaveBeenCalled();

    spy.mockClear();
    await expect(
      Promise.resolve().then(() => call(request('admin-user', Role.Admin))),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(spy).not.toHaveBeenCalled();
  });
});
