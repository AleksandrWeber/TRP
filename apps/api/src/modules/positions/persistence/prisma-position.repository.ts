import { Prisma, type PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import { PositionSide, type Position } from '../domain/position';
import type { PositionRepository } from './position.repository';

type PositionRow = Prisma.PaperPositionGetPayload<Record<string, never>>;

export class PrismaPositionRepository implements PositionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByAccount(workspaceId: string, paperAccountId: string): Promise<Position[]> {
    const rows = await this.prisma.paperPosition.findMany({
      where: { workspaceId, paperAccountId },
      orderBy: [{ instrument: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toDomain);
  }

  async listByInstrument(workspaceId: string, instrument: string): Promise<Position[]> {
    const rows = await this.prisma.paperPosition.findMany({
      where: { workspaceId, instrument },
      orderBy: [{ paperAccountId: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toDomain);
  }

  async findByIdentity(
    workspaceId: string,
    paperAccountId: string,
    instrument: string,
  ): Promise<Position | null> {
    const row = await this.prisma.paperPosition.findUnique({
      where: {
        workspaceId_paperAccountId_instrument: { workspaceId, paperAccountId, instrument },
      },
    });
    return row ? toDomain(row) : null;
  }

  async findByIdentityForUpdate(
    workspaceId: string,
    paperAccountId: string,
    instrument: string,
    transaction: TransactionContext,
  ): Promise<Position | null> {
    const client = prismaClientForTransaction(transaction);
    await client.$queryRaw(Prisma.sql`
      SELECT "id"
      FROM "paper_positions"
      WHERE "workspace_id" = ${workspaceId}
        AND "paper_account_id" = ${paperAccountId}
        AND "instrument" = ${instrument}
      FOR UPDATE
    `);
    const row = await client.paperPosition.findUnique({
      where: {
        workspaceId_paperAccountId_instrument: { workspaceId, paperAccountId, instrument },
      },
    });
    return row ? toDomain(row) : null;
  }

  async save(
    position: Position,
    expectedVersion: number,
    transaction: TransactionContext,
  ): Promise<Position> {
    if (position.version !== expectedVersion + 1) {
      throw new Error('Position version must advance exactly once');
    }
    const client = prismaClientForTransaction(transaction);
    if (expectedVersion === 0) {
      await client.paperPosition.create({ data: toData(position) });
      return position;
    }
    const updated = await client.paperPosition.updateMany({
      where: {
        id: position.id,
        workspaceId: position.workspaceId,
        version: expectedVersion,
      },
      data: toUpdateData(position),
    });
    if (updated.count !== 1) throw new Error('Position optimistic version conflict');
    return position;
  }
}

function toData(position: Position): Prisma.PaperPositionUncheckedCreateInput {
  return {
    id: position.id,
    workspaceId: position.workspaceId,
    paperAccountId: position.paperAccountId,
    instrument: position.instrument,
    side: position.side,
    quantity: position.quantity,
    averageEntryPrice: position.averageEntryPrice,
    costBasis: position.costBasis,
    realizedPnl: position.realizedPnl,
    version: position.version,
    lastAppliedFillId: position.lastAppliedFillId,
    lastAppliedFillSequence: position.lastAppliedFillSequence,
    occurredAt: new Date(position.occurredAt),
    recordedAt: new Date(position.recordedAt),
  };
}

function toUpdateData(position: Position): Prisma.PaperPositionUpdateManyMutationInput {
  return {
    side: position.side,
    quantity: position.quantity,
    averageEntryPrice: position.averageEntryPrice,
    costBasis: position.costBasis,
    realizedPnl: position.realizedPnl,
    version: position.version,
    lastAppliedFillId: position.lastAppliedFillId,
    lastAppliedFillSequence: position.lastAppliedFillSequence,
    occurredAt: new Date(position.occurredAt),
    recordedAt: new Date(position.recordedAt),
  };
}

function toDomain(row: PositionRow): Position {
  if (!Object.values(PositionSide).includes(row.side as PositionSide)) {
    throw new Error(`unsupported Position side: ${row.side}`);
  }
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    paperAccountId: row.paperAccountId,
    instrument: row.instrument,
    side: row.side as PositionSide,
    quantity: row.quantity.toFixed(),
    averageEntryPrice: row.averageEntryPrice.toFixed(),
    costBasis: row.costBasis.toFixed(),
    realizedPnl: row.realizedPnl.toFixed(),
    version: row.version,
    lastAppliedFillId: row.lastAppliedFillId,
    lastAppliedFillSequence: row.lastAppliedFillSequence,
    occurredAt: row.occurredAt.toISOString(),
    recordedAt: row.recordedAt.toISOString(),
  });
}
