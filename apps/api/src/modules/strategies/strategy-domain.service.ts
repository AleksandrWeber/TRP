import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  isStrategyDirection,
  isStrategyStatus,
  isStrategyTimeframe,
  type Strategy,
  type StrategyDirection,
  type StrategyParameters,
  type StrategyStatus,
  type StrategyTimeframe,
} from './strategy';
import type { StrategyRepository } from './repositories/strategy.repository';
import { STRATEGY_REPOSITORY } from './repositories/strategy.repository.token';

export type CreateStrategyInput = {
  workspaceId: string;
  name: string;
  tradingPair: string;
  timeframe: StrategyTimeframe;
  direction: StrategyDirection;
  description?: string;
  status?: StrategyStatus;
  positionSize?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  parameters?: StrategyParameters;
};

export type UpdateStrategyInput = {
  name?: string;
  tradingPair?: string;
  timeframe?: StrategyTimeframe;
  direction?: StrategyDirection;
  description?: string;
  status?: StrategyStatus;
  positionSize?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  parameters?: StrategyParameters;
};

/**
 * Strategy domain service (US004/US005).
 * create / getById / listByWorkspace / update / delete.
 *
 * Every read and mutation is workspace-scoped: a strategy belonging to a
 * different workspace is treated as non-existent (returns null / false).
 * Storage is delegated to StrategyRepository. No calculations or trading logic.
 */
@Injectable()
export class StrategyDomainService {
  constructor(
    @Inject(STRATEGY_REPOSITORY)
    private readonly repository: StrategyRepository,
  ) {}

  async create(input: CreateStrategyInput): Promise<Strategy> {
    assertNonEmpty(input.workspaceId, 'workspaceId');
    assertNonEmpty(input.name, 'name');
    assertTradingPair(input.tradingPair);
    assertTimeframe(input.timeframe);
    assertDirection(input.direction);
    if (input.status !== undefined) assertStatus(input.status);
    assertPositive(input.positionSize ?? 1, 'positionSize');
    assertPercent(input.stopLossPercent ?? 0, 'stopLossPercent');
    assertPercent(input.takeProfitPercent ?? 0, 'takeProfitPercent');
    assertParameters(input.parameters ?? {});

    const now = new Date().toISOString();
    const strategy: Strategy = {
      id: randomUUID(),
      workspaceId: input.workspaceId.trim(),
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      status: input.status ?? 'draft',
      tradingPair: input.tradingPair.trim(),
      timeframe: input.timeframe,
      direction: input.direction,
      positionSize: input.positionSize ?? 1,
      stopLossPercent: input.stopLossPercent ?? 0,
      takeProfitPercent: input.takeProfitPercent ?? 0,
      parameters: structuredClone(input.parameters ?? {}),
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.save(strategy);
    return strategy;
  }

  async getById(workspaceId: string, id: string): Promise<Strategy | null> {
    const strategy = await this.repository.findById(id);
    if (!strategy || strategy.workspaceId !== workspaceId) return null;
    return strategy;
  }

  async listByWorkspace(workspaceId: string): Promise<Strategy[]> {
    return this.repository.findByWorkspaceId(workspaceId);
  }

  async update(
    workspaceId: string,
    id: string,
    input: UpdateStrategyInput,
  ): Promise<Strategy | null> {
    const existing = await this.getById(workspaceId, id);
    if (!existing) return null;

    if (input.name !== undefined) assertNonEmpty(input.name, 'name');
    if (input.tradingPair !== undefined) assertTradingPair(input.tradingPair);
    if (input.timeframe !== undefined) assertTimeframe(input.timeframe);
    if (input.direction !== undefined) assertDirection(input.direction);
    if (input.status !== undefined) assertStatus(input.status);
    if (input.positionSize !== undefined) assertPositive(input.positionSize, 'positionSize');
    if (input.stopLossPercent !== undefined) {
      assertPercent(input.stopLossPercent, 'stopLossPercent');
    }
    if (input.takeProfitPercent !== undefined) {
      assertPercent(input.takeProfitPercent, 'takeProfitPercent');
    }
    if (input.parameters !== undefined) assertParameters(input.parameters);

    const updated: Strategy = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      description:
        input.description !== undefined ? input.description.trim() : existing.description,
      status: input.status ?? existing.status,
      tradingPair:
        input.tradingPair !== undefined ? input.tradingPair.trim() : existing.tradingPair,
      timeframe: input.timeframe ?? existing.timeframe,
      direction: input.direction ?? existing.direction,
      positionSize: input.positionSize ?? existing.positionSize,
      stopLossPercent: input.stopLossPercent ?? existing.stopLossPercent,
      takeProfitPercent: input.takeProfitPercent ?? existing.takeProfitPercent,
      parameters:
        input.parameters !== undefined ? structuredClone(input.parameters) : existing.parameters,
      updatedAt: new Date().toISOString(),
    };

    await this.repository.save(updated);
    return updated;
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const existing = await this.getById(workspaceId, id);
    if (!existing) return false;

    await this.repository.delete(id);
    return true;
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}

function assertStatus(status: string): void {
  if (!isStrategyStatus(status)) {
    throw new Error(`unsupported Strategy status: ${status}`);
  }
}

function assertTradingPair(value: string): void {
  assertNonEmpty(value, 'tradingPair');
  if (!/^[A-Z0-9]+$/.test(value.trim())) {
    throw new Error('tradingPair must contain only uppercase letters and numbers');
  }
}

function assertTimeframe(value: string): asserts value is StrategyTimeframe {
  if (!isStrategyTimeframe(value)) {
    throw new Error(`unsupported Strategy timeframe: ${value}`);
  }
}

function assertDirection(value: string): asserts value is StrategyDirection {
  if (!isStrategyDirection(value)) {
    throw new Error(`unsupported Strategy direction: ${value}`);
  }
}

function assertPositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be greater than zero`);
  }
}

function assertPercent(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${field} must be between 0 and 100`);
  }
}

function assertParameters(value: StrategyParameters): void {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new Error('parameters must be a JSON object');
  }
}
