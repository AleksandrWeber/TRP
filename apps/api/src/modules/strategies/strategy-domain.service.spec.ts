import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryStrategyRepository } from './repositories/in-memory-strategy.repository';
import { StrategyDomainService } from './strategy-domain.service';

const configuration = {
  tradingPair: 'BTCUSDT',
  timeframe: '1h' as const,
  direction: 'BOTH' as const,
};

describe('StrategyDomainService (US004/US005)', () => {
  let service: StrategyDomainService;

  beforeEach(() => {
    service = new StrategyDomainService(new InMemoryStrategyRepository());
  });

  it('creates a strategy with defaults and trims input', async () => {
    const strategy = await service.create({
      workspaceId: ' ws-1 ',
      name: '  Momentum  ',
      ...configuration,
      description: '  Breakout idea  ',
      positionSize: 250,
      stopLossPercent: 2.5,
      takeProfitPercent: 6,
      parameters: { emaFast: 20, emaSlow: 50 },
    });

    expect(strategy).toEqual({
      id: expect.any(String),
      workspaceId: 'ws-1',
      name: 'Momentum',
      description: 'Breakout idea',
      status: 'draft',
      tradingPair: 'BTCUSDT',
      timeframe: '1h',
      direction: 'BOTH',
      positionSize: 250,
      stopLossPercent: 2.5,
      takeProfitPercent: 6,
      parameters: { emaFast: 20, emaSlow: 50 },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(strategy.createdAt).toBe(strategy.updatedAt);
  });

  it('rejects empty name and unsupported status', async () => {
    await expect(
      service.create({ workspaceId: 'ws-1', name: '  ', ...configuration }),
    ).rejects.toThrow('name must not be empty');
    await expect(
      service.create({
        workspaceId: 'ws-1',
        name: 'X',
        ...configuration,
        status: 'live' as never,
      }),
    ).rejects.toThrow('unsupported Strategy status: live');
  });

  it('lists strategies only for the requested workspace, oldest first', async () => {
    const first = await service.create({ workspaceId: 'ws-1', name: 'A', ...configuration });
    const second = await service.create({ workspaceId: 'ws-1', name: 'B', ...configuration });
    await service.create({ workspaceId: 'ws-2', name: 'Other', ...configuration });

    const listed = await service.listByWorkspace('ws-1');

    // Deterministic order: createdAt ascending, id as tiebreak (same-ms creates).
    const expectedOrder = [first, second]
      .sort(
        (left, right) =>
          left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
      )
      .map((s) => s.id);
    expect(listed.map((s) => s.id)).toEqual(expectedOrder);
    expect(listed.every((s) => s.workspaceId === 'ws-1')).toBe(true);
  });

  it('getById hides strategies belonging to another workspace', async () => {
    const strategy = await service.create({ workspaceId: 'ws-1', name: 'A', ...configuration });

    expect(await service.getById('ws-1', strategy.id)).toEqual(strategy);
    expect(await service.getById('ws-2', strategy.id)).toBeNull();
    expect(await service.getById('ws-1', 'missing')).toBeNull();
  });

  it('updates only provided fields and bumps updatedAt', async () => {
    const created = await service.create({
      workspaceId: 'ws-1',
      name: 'A',
      ...configuration,
      description: 'Original',
    });

    const updated = await service.update('ws-1', created.id, {
      status: 'active',
      tradingPair: 'ETHUSDT',
      timeframe: '15m',
      direction: 'LONG',
      positionSize: 500,
      stopLossPercent: 3,
      takeProfitPercent: 8,
      parameters: { rsi: 14 },
    });

    expect(updated).not.toBeNull();
    expect(updated!.name).toBe('A');
    expect(updated!.description).toBe('Original');
    expect(updated!.status).toBe('active');
    expect(updated).toMatchObject({
      tradingPair: 'ETHUSDT',
      timeframe: '15m',
      direction: 'LONG',
      positionSize: 500,
      stopLossPercent: 3,
      takeProfitPercent: 8,
      parameters: { rsi: 14 },
    });
    expect(updated!.createdAt).toBe(created.createdAt);
    expect(updated!.updatedAt >= created.updatedAt).toBe(true);
  });

  it('update and delete refuse cross-workspace access', async () => {
    const strategy = await service.create({ workspaceId: 'ws-1', name: 'A', ...configuration });

    expect(await service.update('ws-2', strategy.id, { name: 'Hacked' })).toBeNull();
    expect(await service.delete('ws-2', strategy.id)).toBe(false);

    const untouched = await service.getById('ws-1', strategy.id);
    expect(untouched!.name).toBe('A');
  });

  it('deletes a strategy in its own workspace', async () => {
    const strategy = await service.create({ workspaceId: 'ws-1', name: 'A', ...configuration });

    expect(await service.delete('ws-1', strategy.id)).toBe(true);
    expect(await service.getById('ws-1', strategy.id)).toBeNull();
    expect(await service.delete('ws-1', strategy.id)).toBe(false);
  });

  it('update rejects empty name and unsupported status', async () => {
    const strategy = await service.create({ workspaceId: 'ws-1', name: 'A', ...configuration });

    await expect(service.update('ws-1', strategy.id, { name: ' ' })).rejects.toThrow(
      'name must not be empty',
    );
    await expect(
      service.update('ws-1', strategy.id, { status: 'paused' as never }),
    ).rejects.toThrow('unsupported Strategy status: paused');
  });

  it('requires valid configuration and enforces risk bounds', async () => {
    await expect(
      service.create({
        workspaceId: 'ws-1',
        name: 'A',
        ...configuration,
        tradingPair: 'btc/usdt',
      }),
    ).rejects.toThrow('tradingPair must contain only uppercase letters and numbers');
    await expect(
      service.create({
        workspaceId: 'ws-1',
        name: 'A',
        ...configuration,
        timeframe: '30m' as never,
      }),
    ).rejects.toThrow('unsupported Strategy timeframe: 30m');
    await expect(
      service.create({
        workspaceId: 'ws-1',
        name: 'A',
        ...configuration,
        direction: 'UP' as never,
      }),
    ).rejects.toThrow('unsupported Strategy direction: UP');
    await expect(
      service.create({ workspaceId: 'ws-1', name: 'A', ...configuration, positionSize: 0 }),
    ).rejects.toThrow('positionSize must be greater than zero');
    await expect(
      service.create({ workspaceId: 'ws-1', name: 'A', ...configuration, stopLossPercent: 101 }),
    ).rejects.toThrow('stopLossPercent must be between 0 and 100');
    await expect(
      service.create({
        workspaceId: 'ws-1',
        name: 'A',
        ...configuration,
        parameters: [] as never,
      }),
    ).rejects.toThrow('parameters must be a JSON object');
  });
});
