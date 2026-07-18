import type { PrismaClient } from '@prisma/client';
import { createMarketCheckpoint } from '../domain/market-checkpoint';
import type {
  DurableMarketCheckpoint,
  MarketCheckpointPersistence,
} from './market-checkpoint-persistence';

/**
 * Prisma-backed durable market checkpoint persistence (US141).
 * Rows survive process restart; regression control lives in MarketCheckpointStore.
 */
export class PrismaMarketCheckpointPersistence implements MarketCheckpointPersistence {
  constructor(private readonly prisma: PrismaClient) {}

  async load(workspaceId: string, streamId: string): Promise<DurableMarketCheckpoint | null> {
    const row = await this.prisma.marketStreamCheckpointRecord.findUnique({
      where: { workspaceId_streamId: { workspaceId, streamId } },
    });
    return row ? toDomain(row) : null;
  }

  async listByWorkspace(workspaceId: string): Promise<DurableMarketCheckpoint[]> {
    const rows = await this.prisma.marketStreamCheckpointRecord.findMany({
      where: { workspaceId },
    });
    return rows.map(toDomain);
  }

  async save(checkpoint: DurableMarketCheckpoint): Promise<void> {
    const data = {
      sourceId: String(checkpoint.sourceId),
      instrument: String(checkpoint.instrument),
      channel: String(checkpoint.channel),
      timeframe: checkpoint.timeframe !== undefined ? String(checkpoint.timeframe) : null,
      lastSequence: checkpoint.lastSequence,
      lastEventId: checkpoint.lastEventId !== null ? String(checkpoint.lastEventId) : null,
      lastOccurredAt:
        checkpoint.lastOccurredAt !== null ? new Date(checkpoint.lastOccurredAt) : null,
      health: String(checkpoint.health),
      heartbeatAt: checkpoint.heartbeatAt !== null ? new Date(checkpoint.heartbeatAt) : null,
      updatedAt: new Date(checkpoint.updatedAt),
    };
    await this.prisma.marketStreamCheckpointRecord.upsert({
      where: {
        workspaceId_streamId: {
          workspaceId: checkpoint.workspaceId,
          streamId: String(checkpoint.streamId),
        },
      },
      create: {
        workspaceId: checkpoint.workspaceId,
        streamId: String(checkpoint.streamId),
        ...data,
      },
      update: data,
    });
  }
}

type MarketStreamCheckpointRow = {
  workspaceId: string;
  streamId: string;
  sourceId: string;
  instrument: string;
  channel: string;
  timeframe: string | null;
  lastSequence: number;
  lastEventId: string | null;
  lastOccurredAt: Date | null;
  health: string;
  heartbeatAt: Date | null;
  updatedAt: Date;
};

function toDomain(row: MarketStreamCheckpointRow): DurableMarketCheckpoint {
  const checkpoint = createMarketCheckpoint({
    workspaceId: row.workspaceId,
    sourceId: row.sourceId,
    instrument: row.instrument,
    channel: row.channel,
    streamId: row.streamId,
    ...(row.timeframe !== null ? { timeframe: row.timeframe } : {}),
    lastSequence: row.lastSequence,
    lastEventId: row.lastEventId,
    lastOccurredAt: row.lastOccurredAt !== null ? row.lastOccurredAt.toISOString() : null,
    health: row.health,
    updatedAt: row.updatedAt.toISOString(),
  });
  return Object.freeze({
    ...checkpoint,
    heartbeatAt: row.heartbeatAt !== null ? row.heartbeatAt.toISOString() : null,
  });
}
