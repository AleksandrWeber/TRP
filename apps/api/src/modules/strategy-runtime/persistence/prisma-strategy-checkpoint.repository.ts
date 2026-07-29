import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import { type LastProcessedCandle, type StrategyCheckpoint } from '../domain/strategy-checkpoint';
import { isStrategyTimeframe } from '../../strategies/strategy';
import type { StrategyCheckpointRepository } from './strategy-checkpoint.repository';

export class PrismaStrategyCheckpointRepository implements StrategyCheckpointRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(
    checkpoint: StrategyCheckpoint,
    expectedVersion: number | null,
    transaction: TransactionContext,
  ): Promise<StrategyCheckpoint> {
    const client = prismaClientForTransaction(transaction);

    if (expectedVersion === null) {
      if (checkpoint.version !== 1) {
        throw new Error('new strategy checkpoint must start at version 1');
      }
      const row = await client.strategyCheckpoint.create({
        data: toRow(checkpoint),
      });
      return toDomain(row);
    }

    if (checkpoint.version !== expectedVersion + 1) {
      throw new Error('strategy checkpoint version must advance exactly once');
    }

    const updated = await client.strategyCheckpoint.updateMany({
      where: {
        id: checkpoint.id,
        workspaceId: checkpoint.workspaceId,
        version: expectedVersion,
      },
      data: {
        lastProcessedCandle: checkpoint.lastProcessedCandle as unknown as Prisma.InputJsonValue,
        lastProcessedEventId: checkpoint.lastProcessedEventId,
        runtimeVersion: checkpoint.runtimeVersion,
        version: checkpoint.version,
        updatedAt: new Date(checkpoint.updatedAt),
      },
    });
    if (updated.count !== 1) {
      throw new Error('strategy checkpoint optimistic version conflict');
    }
    return checkpoint;
  }

  async findBySession(
    workspaceId: string,
    sessionId: string,
    transaction?: TransactionContext,
  ): Promise<StrategyCheckpoint | null> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const row = await client.strategyCheckpoint.findUnique({
      where: { workspaceId_sessionId: { workspaceId, sessionId } },
    });
    return row ? toDomain(row) : null;
  }

  async findById(workspaceId: string, checkpointId: string): Promise<StrategyCheckpoint | null> {
    const row = await this.prisma.strategyCheckpoint.findFirst({
      where: { id: checkpointId, workspaceId },
    });
    return row ? toDomain(row) : null;
  }
}

type StrategyCheckpointRow = {
  id: string;
  workspaceId: string;
  deploymentId: string;
  sessionId: string;
  lastProcessedCandle: Prisma.JsonValue;
  lastProcessedEventId: string;
  runtimeVersion: string;
  version: number;
  updatedAt: Date;
};

function toRow(checkpoint: StrategyCheckpoint): Prisma.StrategyCheckpointUncheckedCreateInput {
  return {
    id: checkpoint.id,
    workspaceId: checkpoint.workspaceId,
    deploymentId: checkpoint.deploymentId,
    sessionId: checkpoint.sessionId,
    lastProcessedCandle: checkpoint.lastProcessedCandle as unknown as Prisma.InputJsonValue,
    lastProcessedEventId: checkpoint.lastProcessedEventId,
    runtimeVersion: checkpoint.runtimeVersion,
    version: checkpoint.version,
    updatedAt: new Date(checkpoint.updatedAt),
  };
}

function toDomain(row: StrategyCheckpointRow): StrategyCheckpoint {
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    deploymentId: row.deploymentId,
    sessionId: row.sessionId,
    lastProcessedCandle: freezeCandle(row.lastProcessedCandle),
    lastProcessedEventId: row.lastProcessedEventId,
    runtimeVersion: row.runtimeVersion,
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
  });
}

function freezeCandle(value: Prisma.JsonValue): LastProcessedCandle {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new Error('persisted lastProcessedCandle must be a JSON object');
  }
  const candle = value as Record<string, unknown>;
  if (
    typeof candle.streamId !== 'string' ||
    typeof candle.sequence !== 'number' ||
    typeof candle.openTime !== 'string' ||
    typeof candle.instrument !== 'string' ||
    typeof candle.timeframe !== 'string'
  ) {
    throw new Error('persisted lastProcessedCandle is malformed');
  }
  if (!isStrategyTimeframe(candle.timeframe)) {
    throw new Error(`unsupported strategy checkpoint timeframe persisted: ${candle.timeframe}`);
  }
  return Object.freeze({
    streamId: candle.streamId,
    sequence: candle.sequence,
    openTime: candle.openTime,
    instrument: candle.instrument,
    timeframe: candle.timeframe,
  });
}
