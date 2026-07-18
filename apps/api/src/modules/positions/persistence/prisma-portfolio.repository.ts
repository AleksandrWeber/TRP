import { Prisma, type PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import type { PortfolioProjection } from '../domain/portfolio-projection';
import type { PortfolioRepository } from './portfolio.repository';

type Row = Prisma.PaperPortfolioProjectionGetPayload<Record<string, never>>;

export class PrismaPortfolioRepository implements PortfolioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async find(workspaceId: string, paperAccountId: string): Promise<PortfolioProjection | null> {
    const row = await this.prisma.paperPortfolioProjection.findUnique({
      where: { workspaceId_paperAccountId: { workspaceId, paperAccountId } },
    });
    return row ? toDomain(row) : null;
  }

  async save(
    projection: PortfolioProjection,
    expectedVersion: number,
    transaction: TransactionContext,
  ): Promise<PortfolioProjection> {
    if (projection.version !== expectedVersion + 1) {
      throw new Error('Portfolio projection version must advance exactly once');
    }
    const client = prismaClientForTransaction(transaction);
    if (expectedVersion === 0) {
      await client.paperPortfolioProjection.create({ data: toCreateData(projection) });
      return projection;
    }
    const updated = await client.paperPortfolioProjection.updateMany({
      where: {
        id: projection.id,
        workspaceId: projection.workspaceId,
        version: expectedVersion,
      },
      data: toUpdateData(projection),
    });
    if (updated.count !== 1) throw new Error('Portfolio projection optimistic version conflict');
    return projection;
  }
}

function toCreateData(
  value: PortfolioProjection,
): Prisma.PaperPortfolioProjectionUncheckedCreateInput {
  return {
    id: value.id,
    workspaceId: value.workspaceId,
    paperAccountId: value.paperAccountId,
    ...toValues(value),
  };
}

function toUpdateData(
  value: PortfolioProjection,
): Prisma.PaperPortfolioProjectionUpdateManyMutationInput {
  return toValues(value);
}

function toValues(value: PortfolioProjection) {
  return {
    currency: value.currency,
    availableCash: value.availableCash,
    reservedCash: value.reservedCash,
    cash: value.cash,
    marketValue: value.marketValue,
    equity: value.equity,
    realizedPnl: value.realizedPnl,
    unrealizedPnl: value.unrealizedPnl,
    totalPnl: value.totalPnl,
    fees: value.fees,
    exposure: value.exposure,
    ledgerVersion: value.ledgerVersion,
    valuationCheckpoint: value.valuationCheckpoint,
    sourceHash: value.sourceHash,
    version: value.version,
    complete: value.complete,
    stalePositionIds: [...value.stalePositionIds],
    valuedAt: value.valuedAt ? new Date(value.valuedAt) : null,
    recordedAt: new Date(value.recordedAt),
  };
}

function toDomain(row: Row): PortfolioProjection {
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    paperAccountId: row.paperAccountId,
    currency: row.currency,
    availableCash: row.availableCash.toFixed(),
    reservedCash: row.reservedCash.toFixed(),
    cash: row.cash.toFixed(),
    marketValue: row.marketValue.toFixed(),
    equity: row.equity.toFixed(),
    realizedPnl: row.realizedPnl.toFixed(),
    unrealizedPnl: row.unrealizedPnl.toFixed(),
    totalPnl: row.totalPnl.toFixed(),
    fees: row.fees.toFixed(),
    exposure: row.exposure.toFixed(),
    ledgerVersion: row.ledgerVersion,
    valuationCheckpoint: row.valuationCheckpoint,
    sourceHash: row.sourceHash,
    version: row.version,
    complete: row.complete,
    stalePositionIds: Object.freeze(asStrings(row.stalePositionIds)),
    valuedAt: row.valuedAt?.toISOString() ?? null,
    recordedAt: row.recordedAt.toISOString(),
  });
}

function asStrings(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error('Portfolio stale Position ids are invalid');
  }
  return value as string[];
}
