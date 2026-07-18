import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { InMemoryStrategyRepository } from './repositories/in-memory-strategy.repository';
import { StrategiesController } from './strategies.controller';
import { StrategyDomainService } from './strategy-domain.service';

const configuration = {
  tradingPair: 'BTCUSDT',
  timeframe: '1h' as const,
  direction: 'BOTH' as const,
};

describe('StrategiesController (US004/US005)', () => {
  let controller: StrategiesController;
  let workspaces: WorkspaceDomainService;
  let workspaceId: string;
  let otherWorkspaceId: string;

  beforeEach(async () => {
    workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const strategies = new StrategyDomainService(new InMemoryStrategyRepository());
    controller = new StrategiesController(strategies, workspaces);

    workspaceId = (await workspaces.create({ name: 'One', ownerUserId: 'user-1' })).id;
    otherWorkspaceId = (await workspaces.create({ name: 'Two', ownerUserId: 'user-2' })).id;
  });

  it('rejects a missing workspace header and an unknown workspace', async () => {
    await expect(controller.list(undefined)).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.list('ws-unknown')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('supports the full CRUD lifecycle within one workspace', async () => {
    const created = await controller.create(
      {
        name: 'Momentum',
        description: 'Breakout idea',
        ...configuration,
        positionSize: 100,
        stopLossPercent: 2,
        takeProfitPercent: 5,
        parameters: { emaFast: 20 },
      },
      workspaceId,
    );
    expect(created.workspaceId).toBe(workspaceId);
    expect(created.status).toBe('draft');
    expect(created).toMatchObject({
      tradingPair: 'BTCUSDT',
      timeframe: '1h',
      direction: 'BOTH',
      positionSize: 100,
      stopLossPercent: 2,
      takeProfitPercent: 5,
      parameters: { emaFast: 20 },
    });

    const listed = await controller.list(workspaceId);
    expect(listed).toEqual([created]);

    const fetched = await controller.get({ id: created.id }, workspaceId);
    expect(fetched).toEqual(created);

    const updated = await controller.update(
      { id: created.id },
      {
        name: 'Momentum v2',
        status: 'active',
        tradingPair: 'ETHUSDT',
        timeframe: '15m',
        direction: 'LONG',
        positionSize: 200,
        stopLossPercent: 3,
        takeProfitPercent: 7,
        parameters: { rsi: 14 },
      },
      workspaceId,
    );
    expect(updated.name).toBe('Momentum v2');
    expect(updated.status).toBe('active');
    expect(updated.description).toBe('Breakout idea');
    expect(updated).toMatchObject({
      tradingPair: 'ETHUSDT',
      timeframe: '15m',
      direction: 'LONG',
      positionSize: 200,
      stopLossPercent: 3,
      takeProfitPercent: 7,
      parameters: { rsi: 14 },
    });

    const removed = await controller.remove({ id: created.id }, workspaceId);
    expect(removed).toEqual({ id: created.id, deleted: true });
    expect(await controller.list(workspaceId)).toEqual([]);
  });

  it('isolates strategies between workspaces', async () => {
    const mine = await controller.create({ name: 'Mine', ...configuration }, workspaceId);
    await controller.create({ name: 'Theirs', ...configuration }, otherWorkspaceId);

    const myList = await controller.list(workspaceId);
    expect(myList.map((s) => s.name)).toEqual(['Mine']);

    await expect(controller.get({ id: mine.id }, otherWorkspaceId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      controller.update({ id: mine.id }, { name: 'Stolen' }, otherWorkspaceId),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(controller.remove({ id: mine.id }, otherWorkspaceId)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const untouched = await controller.get({ id: mine.id }, workspaceId);
    expect(untouched.name).toBe('Mine');
  });

  it('returns 404 for unknown strategy ids', async () => {
    await expect(controller.get({ id: 'missing' }, workspaceId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      controller.update({ id: 'missing' }, { name: 'X' }, workspaceId),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(controller.remove({ id: 'missing' }, workspaceId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
