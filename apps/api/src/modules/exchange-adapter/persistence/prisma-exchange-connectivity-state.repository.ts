import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION,
  type DurableExchangeConnectivityState,
} from '../domain/durable-exchange-connectivity-state';
import type { ExchangeConnectivityStateRepository } from '../domain/exchange-connectivity-state.repository';

type ExchangeConnectivityStateRow = Prisma.WorkspaceExchangeConnectivityStateGetPayload<
  Record<string, never>
>;

export class PrismaExchangeConnectivityStateRepository implements ExchangeConnectivityStateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveExchangeConnectivityState(
    state: DurableExchangeConnectivityState,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(state);
    await client.workspaceExchangeConnectivityState.upsert({
      where: { workspaceId: state.workspaceId },
      create: data,
      update: data,
    });
  }

  async loadExchangeConnectivityState(
    workspaceId: string,
  ): Promise<DurableExchangeConnectivityState | null> {
    const row = await this.prisma.workspaceExchangeConnectivityState.findUnique({
      where: { workspaceId },
    });
    return row ? toDomain(row) : null;
  }

  async listAllExchangeConnectivityStates(): Promise<readonly DurableExchangeConnectivityState[]> {
    const rows = await this.prisma.workspaceExchangeConnectivityState.findMany({
      orderBy: { workspaceId: 'asc' },
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  state: DurableExchangeConnectivityState,
): Prisma.WorkspaceExchangeConnectivityStateUncheckedCreateInput {
  return {
    workspaceId: state.workspaceId,
    schemaVersion: state.schemaVersion,
    provider: state.provider,
    connectionAnchorConnectionId: state.connectionAnchorConnectionId,
    connectionAnchorRecordedAt:
      state.connectionAnchorRecordedAt !== null ? new Date(state.connectionAnchorRecordedAt) : null,
    connectionAnchorRecordedByActorId: state.connectionAnchorRecordedByActorId,
    adapterAnchorExchangeConnectionId: state.adapterAnchorExchangeConnectionId,
    adapterAnchorRecordedAt:
      state.adapterAnchorRecordedAt !== null ? new Date(state.adapterAnchorRecordedAt) : null,
    adapterAnchorRecordedByActorId: state.adapterAnchorRecordedByActorId,
    correlationId: state.correlationId,
    updatedAt: new Date(state.updatedAt),
  };
}

function toDomain(row: ExchangeConnectivityStateRow): DurableExchangeConnectivityState {
  if (row.schemaVersion !== EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION) {
    throw new Error(`Unsupported exchange connectivity schema version: ${row.schemaVersion}`);
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    schemaVersion: row.schemaVersion,
    provider: row.provider,
    connectionAnchorConnectionId: row.connectionAnchorConnectionId,
    connectionAnchorRecordedAt: row.connectionAnchorRecordedAt?.toISOString() ?? null,
    connectionAnchorRecordedByActorId: row.connectionAnchorRecordedByActorId,
    adapterAnchorExchangeConnectionId: row.adapterAnchorExchangeConnectionId,
    adapterAnchorRecordedAt: row.adapterAnchorRecordedAt?.toISOString() ?? null,
    adapterAnchorRecordedByActorId: row.adapterAnchorRecordedByActorId,
    correlationId: row.correlationId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
