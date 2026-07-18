import { Prisma, type PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import type { PaperFill, PaperFillSide } from '../domain/paper-fill';
import type { FillRepository } from './fill.repository';

type PaperFillRow = Prisma.PaperFillGetPayload<Record<string, never>>;

export class PrismaFillRepository implements FillRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(fill: PaperFill, transaction: TransactionContext): Promise<PaperFill> {
    const client = prismaClientForTransaction(transaction);
    await client.paperFill.create({ data: toCreateData(fill) });
    return fill;
  }

  async findByOrder(workspaceId: string, orderId: string): Promise<PaperFill[]> {
    const rows = await this.prisma.paperFill.findMany({
      where: { workspaceId, orderId },
      orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toDomain);
  }

  async findById(workspaceId: string, fillId: string): Promise<PaperFill | null> {
    const row = await this.prisma.paperFill.findFirst({ where: { id: fillId, workspaceId } });
    return row ? toDomain(row) : null;
  }
}

function toCreateData(fill: PaperFill): Prisma.PaperFillUncheckedCreateInput {
  return {
    id: fill.id,
    workspaceId: fill.workspaceId,
    orderId: fill.orderId,
    paperAccountId: fill.paperAccountId,
    tradingSessionId: fill.tradingSessionId,
    adapterOrderId: fill.adapterOrderId,
    adapterFillId: fill.adapterFillId,
    sequence: fill.sequence,
    instrument: fill.instrument,
    side: fill.side,
    price: fill.price,
    quantity: fill.quantity,
    grossNotional: fill.grossNotional,
    fee: fill.fee,
    executionContextHash: fill.executionContextHash,
    configurationId: fill.configurationId,
    configurationVersion: fill.configurationVersion,
    configurationHash: fill.configurationHash,
    occurredAt: new Date(fill.occurredAt),
    recordedAt: new Date(fill.recordedAt),
  };
}

function toDomain(row: PaperFillRow): PaperFill {
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    orderId: row.orderId,
    paperAccountId: row.paperAccountId,
    tradingSessionId: row.tradingSessionId,
    adapterOrderId: row.adapterOrderId,
    adapterFillId: row.adapterFillId,
    sequence: row.sequence,
    instrument: row.instrument,
    side: toSide(row.side),
    price: row.price.toFixed(),
    quantity: row.quantity.toFixed(),
    grossNotional: row.grossNotional.toFixed(),
    fee: row.fee.toFixed(),
    executionContextHash: row.executionContextHash,
    configurationId: row.configurationId,
    configurationVersion: row.configurationVersion,
    configurationHash: row.configurationHash,
    occurredAt: row.occurredAt.toISOString(),
    recordedAt: row.recordedAt.toISOString(),
  });
}

function toSide(value: string): PaperFillSide {
  if (value !== 'buy' && value !== 'sell') throw new Error(`unsupported fill side: ${value}`);
  return value;
}

export function isDuplicateFill(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
