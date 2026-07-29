import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  isSignalIntentDirection,
  SignalIntentDirection,
  type SignalIntent,
  type SignalIntentMarketCheckpoint,
  type SignalIntentMetadata,
} from '../domain/signal-intent';
import { isStrategyTimeframe } from '../../strategies/strategy';
import type { SignalIntentRepository } from './signal-intent.repository';

export class PrismaSignalIntentRepository implements SignalIntentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(intent: SignalIntent, transaction: TransactionContext): Promise<SignalIntent> {
    const row = await prismaClientForTransaction(transaction).signalIntent.create({
      data: toRow(intent),
    });
    return toDomain(row);
  }

  async findById(workspaceId: string, intentId: string): Promise<SignalIntent | null> {
    const row = await this.prisma.signalIntent.findFirst({
      where: { id: intentId, workspaceId },
    });
    return row ? toDomain(row) : null;
  }

  async findByIntentHash(
    workspaceId: string,
    intentHash: string,
    transaction?: TransactionContext,
  ): Promise<SignalIntent | null> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const row = await client.signalIntent.findUnique({
      where: { workspaceId_intentHash: { workspaceId, intentHash } },
    });
    return row ? toDomain(row) : null;
  }

  async listBySession(workspaceId: string, sessionId: string): Promise<SignalIntent[]> {
    const rows = await this.prisma.signalIntent.findMany({
      where: { workspaceId, sessionId },
      orderBy: { generatedAt: 'asc' },
    });
    return rows.map(toDomain);
  }
}

type SignalIntentRow = {
  id: string;
  intentVersion: number;
  intentHash: string;
  workspaceId: string;
  deploymentId: string;
  sessionId: string;
  strategyVersion: string;
  instrument: string;
  timeframe: string;
  direction: string;
  confidence: number | null;
  marketCheckpoint: Prisma.JsonValue;
  generatedAt: Date;
  recordedAt: Date;
  actorId: string;
  correlationId: string | null;
  metadata: Prisma.JsonValue;
};

function toRow(intent: SignalIntent): Prisma.SignalIntentUncheckedCreateInput {
  return {
    id: intent.id,
    intentVersion: intent.intentVersion,
    intentHash: intent.intentHash,
    workspaceId: intent.workspaceId,
    deploymentId: intent.deploymentId,
    sessionId: intent.sessionId,
    strategyVersion: intent.strategyVersion,
    instrument: intent.instrument,
    timeframe: intent.timeframe,
    direction: intent.direction,
    confidence: intent.confidence,
    marketCheckpoint: intent.marketCheckpoint as unknown as Prisma.InputJsonValue,
    generatedAt: new Date(intent.generatedAt),
    recordedAt: new Date(intent.recordedAt),
    actorId: intent.actorId,
    correlationId: intent.correlationId,
    metadata: intent.metadata as Prisma.InputJsonValue,
  };
}

function toDomain(row: SignalIntentRow): SignalIntent {
  if (row.intentVersion !== 1) {
    throw new Error(`unsupported signal intent version persisted: ${row.intentVersion}`);
  }
  if (!isSignalIntentDirection(row.direction)) {
    throw new Error(`unsupported signal intent direction persisted: ${row.direction}`);
  }
  if (!isStrategyTimeframe(row.timeframe)) {
    throw new Error(`unsupported signal intent timeframe persisted: ${row.timeframe}`);
  }
  return Object.freeze({
    intentVersion: 1 as const,
    id: row.id,
    intentHash: row.intentHash,
    workspaceId: row.workspaceId,
    deploymentId: row.deploymentId,
    sessionId: row.sessionId,
    strategyVersion: row.strategyVersion,
    instrument: row.instrument,
    timeframe: row.timeframe,
    direction: row.direction as SignalIntentDirection,
    confidence:
      row.confidence === null || row.confidence === undefined
        ? null
        : Math.round(row.confidence * 10_000) / 10_000,
    marketCheckpoint: freezeCheckpoint(row.marketCheckpoint),
    generatedAt: row.generatedAt.toISOString(),
    recordedAt: row.recordedAt.toISOString(),
    actorId: row.actorId,
    correlationId: row.correlationId,
    metadata: freezeJson(row.metadata, 'metadata') as SignalIntentMetadata,
  });
}

function freezeCheckpoint(value: Prisma.JsonValue): SignalIntentMarketCheckpoint {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new Error('persisted marketCheckpoint must be a JSON object');
  }
  const checkpoint = value as Record<string, unknown>;
  if (
    typeof checkpoint.streamId !== 'string' ||
    typeof checkpoint.eventId !== 'string' ||
    typeof checkpoint.sequence !== 'number'
  ) {
    throw new Error('persisted marketCheckpoint is malformed');
  }
  return Object.freeze({
    streamId: checkpoint.streamId,
    sequence: checkpoint.sequence,
    eventId: checkpoint.eventId,
  });
}

function freezeJson(value: Prisma.JsonValue, label: string): Readonly<Record<string, unknown>> {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new Error(`persisted ${label} must be a JSON object`);
  }
  return Object.freeze(structuredClone(value as Record<string, unknown>));
}
