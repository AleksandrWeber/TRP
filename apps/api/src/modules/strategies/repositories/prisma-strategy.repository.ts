import { Prisma, type PrismaClient, type StrategyRecord } from '@prisma/client';
import {
  isStrategyDirection,
  isStrategyStatus,
  isStrategyTimeframe,
  type Strategy,
  type StrategyParameters,
} from '../strategy';
import type { StrategyRepository } from './strategy.repository';

export class PrismaStrategyRepository implements StrategyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(strategy: Strategy): Promise<void> {
    await this.prisma.strategyRecord.upsert({
      where: { id: strategy.id },
      create: {
        id: strategy.id,
        workspaceId: strategy.workspaceId,
        name: strategy.name,
        description: strategy.description,
        status: strategy.status,
        tradingPair: strategy.tradingPair,
        timeframe: strategy.timeframe,
        direction: strategy.direction,
        positionSize: strategy.positionSize,
        stopLossPercent: strategy.stopLossPercent,
        takeProfitPercent: strategy.takeProfitPercent,
        parameters: strategy.parameters as Prisma.InputJsonValue,
        createdAt: new Date(strategy.createdAt),
        updatedAt: new Date(strategy.updatedAt),
      },
      update: {
        name: strategy.name,
        description: strategy.description,
        status: strategy.status,
        tradingPair: strategy.tradingPair,
        timeframe: strategy.timeframe,
        direction: strategy.direction,
        positionSize: strategy.positionSize,
        stopLossPercent: strategy.stopLossPercent,
        takeProfitPercent: strategy.takeProfitPercent,
        parameters: strategy.parameters as Prisma.InputJsonValue,
        updatedAt: new Date(strategy.updatedAt),
      },
    });
  }

  async findById(id: string): Promise<Strategy | null> {
    const row = await this.prisma.strategyRecord.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<Strategy[]> {
    const rows = await this.prisma.strategyRecord.findMany({
      where: { workspaceId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.strategyRecord.deleteMany({ where: { id } });
  }
}

function toDomain(row: StrategyRecord): Strategy {
  if (!isStrategyStatus(row.status)) {
    throw new Error(`unsupported Strategy status: ${row.status}`);
  }
  if (!isStrategyTimeframe(row.timeframe)) {
    throw new Error(`unsupported Strategy timeframe: ${row.timeframe}`);
  }
  if (!isStrategyDirection(row.direction)) {
    throw new Error(`unsupported Strategy direction: ${row.direction}`);
  }
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    description: row.description,
    status: row.status,
    tradingPair: row.tradingPair,
    timeframe: row.timeframe,
    direction: row.direction,
    positionSize: row.positionSize,
    stopLossPercent: row.stopLossPercent,
    takeProfitPercent: row.takeProfitPercent,
    parameters: toParameters(row.parameters),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toParameters(value: Prisma.JsonValue): StrategyParameters {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new Error('unsupported Strategy parameters: expected JSON object');
  }
  return value as StrategyParameters;
}
