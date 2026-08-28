import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  BYBIT_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
  BYBIT_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION,
  type DurableBybitExchangeConnectivityState,
} from '../domain/durable-bybit-exchange-connectivity-state';
import type { BybitExchangeConnectivityStateRepository } from '../domain/bybit-exchange-connectivity-state.repository';
import { assertRecoverableBybitExchangeConnectivityState } from '../domain/bybit-exchange-connectivity-restart-recovery';

type BybitExchangeConnectivityStateRow = Prisma.WorkspaceBybitExchangeConnectivityStateGetPayload<
  Record<string, never>
>;

export class PrismaBybitExchangeConnectivityStateRepository implements BybitExchangeConnectivityStateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveBybitExchangeConnectivityState(
    state: DurableBybitExchangeConnectivityState,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(state);
    await client.workspaceBybitExchangeConnectivityState.upsert({
      where: { workspaceId: state.workspaceId },
      create: data,
      update: data,
    });
  }

  async loadBybitExchangeConnectivityState(
    workspaceId: string,
  ): Promise<DurableBybitExchangeConnectivityState | null> {
    const row = await this.prisma.workspaceBybitExchangeConnectivityState.findUnique({
      where: { workspaceId },
    });
    return row ? toDomain(row) : null;
  }

  async listAllBybitExchangeConnectivityStates(): Promise<
    readonly DurableBybitExchangeConnectivityState[]
  > {
    const rows = await this.prisma.workspaceBybitExchangeConnectivityState.findMany({
      orderBy: { workspaceId: 'asc' },
    });
    return Object.freeze(
      rows.map((row, index) =>
        assertRecoverableBybitExchangeConnectivityState(toDomain(row), index),
      ),
    );
  }
}

function toRow(
  state: DurableBybitExchangeConnectivityState,
): Prisma.WorkspaceBybitExchangeConnectivityStateUncheckedCreateInput {
  return {
    workspaceId: state.workspaceId,
    schemaVersion: state.schemaVersion,
    exchangeIdentifier: state.exchangeIdentifier,
    connectionAnchorConnectionId: state.connectionAnchorConnectionId,
    connectionAnchorRecordedAt:
      state.connectionAnchorRecordedAt !== null ? new Date(state.connectionAnchorRecordedAt) : null,
    connectionAnchorRecordedByActorId: state.connectionAnchorRecordedByActorId,
    adapterAnchorExchangeConnectionId: state.adapterAnchorExchangeConnectionId,
    adapterAnchorRecordedAt:
      state.adapterAnchorRecordedAt !== null ? new Date(state.adapterAnchorRecordedAt) : null,
    adapterAnchorRecordedByActorId: state.adapterAnchorRecordedByActorId,
    correlationId: state.correlationId,
    integrityMetadataHash: state.integrityMetadataHash,
    updatedAt: new Date(state.updatedAt),
  };
}

function toDomain(row: BybitExchangeConnectivityStateRow): DurableBybitExchangeConnectivityState {
  if (row.schemaVersion !== BYBIT_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION) {
    throw new Error(`Unsupported Bybit exchange connectivity schema version: ${row.schemaVersion}`);
  }

  if (row.exchangeIdentifier !== BYBIT_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER) {
    throw new Error(
      `Unsupported Bybit exchange connectivity exchange identifier: ${row.exchangeIdentifier}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    schemaVersion: row.schemaVersion,
    exchangeIdentifier: BYBIT_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
    connectionAnchorConnectionId: row.connectionAnchorConnectionId,
    connectionAnchorRecordedAt: row.connectionAnchorRecordedAt?.toISOString() ?? null,
    connectionAnchorRecordedByActorId: row.connectionAnchorRecordedByActorId,
    adapterAnchorExchangeConnectionId: row.adapterAnchorExchangeConnectionId,
    adapterAnchorRecordedAt: row.adapterAnchorRecordedAt?.toISOString() ?? null,
    adapterAnchorRecordedByActorId: row.adapterAnchorRecordedByActorId,
    correlationId: row.correlationId,
    integrityMetadataHash: row.integrityMetadataHash,
    updatedAt: row.updatedAt.toISOString(),
  });
}
