import { Prisma, type PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import type { PositionValuation } from '../domain/position-valuation';
import type { PositionValuationRepository } from './position-valuation.repository';

type Row = Prisma.PositionValuationGetPayload<Record<string, never>>;

export class PrismaPositionValuationRepository implements PositionValuationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByPosition(
    workspaceId: string,
    positionId: string,
    transaction?: TransactionContext,
  ): Promise<PositionValuation | null> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const row = await client.positionValuation.findUnique({
      where: { workspaceId_positionId: { workspaceId, positionId } },
    });
    return row ? toDomain(row) : null;
  }

  async listByAccount(workspaceId: string, paperAccountId: string): Promise<PositionValuation[]> {
    const rows = await this.prisma.positionValuation.findMany({
      where: { workspaceId, paperAccountId },
      orderBy: [{ instrument: 'asc' }, { positionId: 'asc' }],
    });
    return rows.map(toDomain);
  }

  async save(
    valuation: PositionValuation,
    expectedVersion: number,
    transaction: TransactionContext,
  ): Promise<PositionValuation> {
    if (valuation.version !== expectedVersion + 1) {
      throw new Error('Position valuation version must advance exactly once');
    }
    const client = prismaClientForTransaction(transaction);
    if (expectedVersion === 0) {
      await client.positionValuation.create({ data: toCreateData(valuation) });
      return valuation;
    }
    const updated = await client.positionValuation.updateMany({
      where: {
        id: valuation.id,
        workspaceId: valuation.workspaceId,
        version: expectedVersion,
      },
      data: toUpdateData(valuation),
    });
    if (updated.count !== 1) throw new Error('Position valuation optimistic version conflict');
    return valuation;
  }
}

function toCreateData(value: PositionValuation): Prisma.PositionValuationUncheckedCreateInput {
  return {
    id: value.id,
    workspaceId: value.workspaceId,
    paperAccountId: value.paperAccountId,
    positionId: value.positionId,
    instrument: value.instrument,
    ...toValues(value),
  };
}

function toUpdateData(value: PositionValuation): Prisma.PositionValuationUpdateManyMutationInput {
  return toValues(value);
}

function toValues(value: PositionValuation) {
  return {
    positionVersion: value.positionVersion,
    version: value.version,
    marketStreamId: value.marketStreamId,
    marketEventId: value.marketEventId,
    marketSequence: value.marketSequence,
    markPrice: value.markPrice,
    quantity: value.quantity,
    costBasis: value.costBasis,
    realizedPnl: value.realizedPnl,
    marketValue: value.marketValue,
    unrealizedPnl: value.unrealizedPnl,
    occurredAt: new Date(value.occurredAt),
    recordedAt: new Date(value.recordedAt),
  };
}

function toDomain(row: Row): PositionValuation {
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    paperAccountId: row.paperAccountId,
    positionId: row.positionId,
    instrument: row.instrument,
    positionVersion: row.positionVersion,
    version: row.version,
    marketStreamId: row.marketStreamId,
    marketEventId: row.marketEventId,
    marketSequence: row.marketSequence,
    markPrice: row.markPrice.toFixed(),
    quantity: row.quantity.toFixed(),
    costBasis: row.costBasis.toFixed(),
    realizedPnl: row.realizedPnl.toFixed(),
    marketValue: row.marketValue.toFixed(),
    unrealizedPnl: row.unrealizedPnl.toFixed(),
    occurredAt: row.occurredAt.toISOString(),
    recordedAt: row.recordedAt.toISOString(),
  });
}
