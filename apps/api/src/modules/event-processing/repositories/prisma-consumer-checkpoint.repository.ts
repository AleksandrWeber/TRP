import type { ConsumerCheckpointDeliveryStatus } from '@prisma/client';
import { toConsumerId, type ConsumerId } from '../domain/consumer-id';
import { ConsumerCheckpointStatus, type ConsumerCheckpoint } from '../domain/consumer-checkpoint';
import type { ConsumerCheckpointRepository } from './consumer-checkpoint.repository';
import type { PrismaConsumerCheckpointClient } from './prisma-event-client';

/**
 * PostgreSQL consumer checkpoint repository (US149 / ADR-013).
 */
export class PrismaConsumerCheckpointRepository implements ConsumerCheckpointRepository {
  constructor(private readonly prisma: PrismaConsumerCheckpointClient) {}

  async get(consumerId: ConsumerId | string, streamId: string): Promise<ConsumerCheckpoint | null> {
    const row = await this.prisma.consumerCheckpointRecord.findUnique({
      where: {
        consumerId_streamId: {
          consumerId: String(consumerId),
          streamId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async save(checkpoint: ConsumerCheckpoint): Promise<ConsumerCheckpoint> {
    const data = {
      consumerVersion: checkpoint.consumerVersion,
      workspaceId: checkpoint.workspaceId,
      lastAppliedSequence: checkpoint.lastAppliedSequence,
      lastAppliedEventId: checkpoint.lastAppliedEventId,
      status: toPrismaStatus(checkpoint.status),
      blockedSequence: checkpoint.blockedSequence,
      lastError: checkpoint.lastError,
      updatedAt: new Date(checkpoint.updatedAt),
    };
    const row = await this.prisma.consumerCheckpointRecord.upsert({
      where: {
        consumerId_streamId: {
          consumerId: String(checkpoint.consumerId),
          streamId: checkpoint.streamId,
        },
      },
      create: {
        consumerId: String(checkpoint.consumerId),
        streamId: checkpoint.streamId,
        ...data,
      },
      update: data,
    });
    return toDomain(row);
  }

  async listByConsumer(consumerId: ConsumerId | string): Promise<ConsumerCheckpoint[]> {
    const rows = await this.prisma.consumerCheckpointRecord.findMany({
      where: { consumerId: String(consumerId) },
    });
    return rows.map(toDomain);
  }
}

type CheckpointRow = {
  consumerId: string;
  streamId: string;
  consumerVersion: string;
  workspaceId: string;
  lastAppliedSequence: number;
  lastAppliedEventId: string | null;
  status: ConsumerCheckpointDeliveryStatus;
  blockedSequence: number | null;
  lastError: string | null;
  updatedAt: Date;
};

function toPrismaStatus(status: ConsumerCheckpointStatus): ConsumerCheckpointDeliveryStatus {
  return status as ConsumerCheckpointDeliveryStatus;
}

function toDomain(row: CheckpointRow): ConsumerCheckpoint {
  return Object.freeze({
    consumerId: toConsumerId(row.consumerId),
    consumerVersion: row.consumerVersion,
    streamId: row.streamId,
    workspaceId: row.workspaceId,
    lastAppliedSequence: row.lastAppliedSequence,
    lastAppliedEventId: row.lastAppliedEventId,
    status: row.status as ConsumerCheckpointStatus,
    blockedSequence: row.blockedSequence,
    lastError: row.lastError,
    updatedAt: row.updatedAt.toISOString(),
  });
}
