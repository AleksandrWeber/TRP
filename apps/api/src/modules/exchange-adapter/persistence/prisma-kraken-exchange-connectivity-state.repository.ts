import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  KRAKEN_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
  KRAKEN_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION,
  type DurableKrakenExchangeConnectivityState,
} from '../domain/durable-kraken-exchange-connectivity-state';
import { assertRecoverableKrakenExchangeConnectivityState } from '../domain/kraken-exchange-connectivity-restart-recovery';
import type { KrakenExchangeConnectivityStateRepository } from '../domain/kraken-exchange-connectivity-state.repository';

type KrakenExchangeConnectivityStateRow = Prisma.WorkspaceKrakenExchangeConnectivityStateGetPayload<
  Record<string, never>
>;

export class PrismaKrakenExchangeConnectivityStateRepository implements KrakenExchangeConnectivityStateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveKrakenExchangeConnectivityState(
    state: DurableKrakenExchangeConnectivityState,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(state);
    await client.workspaceKrakenExchangeConnectivityState.upsert({
      where: { workspaceId: state.workspaceId },
      create: data,
      update: data,
    });
  }

  async loadKrakenExchangeConnectivityState(
    workspaceId: string,
  ): Promise<DurableKrakenExchangeConnectivityState | null> {
    const row = await this.prisma.workspaceKrakenExchangeConnectivityState.findUnique({
      where: { workspaceId },
    });
    return row ? toDomain(row) : null;
  }

  async listAllKrakenExchangeConnectivityStates(): Promise<
    readonly DurableKrakenExchangeConnectivityState[]
  > {
    const rows = await this.prisma.workspaceKrakenExchangeConnectivityState.findMany({
      orderBy: { workspaceId: 'asc' },
    });
    return Object.freeze(
      rows.map((row, index) =>
        assertRecoverableKrakenExchangeConnectivityState(toDomain(row), index),
      ),
    );
  }
}

function toRow(
  state: DurableKrakenExchangeConnectivityState,
): Prisma.WorkspaceKrakenExchangeConnectivityStateUncheckedCreateInput {
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

function toDomain(row: KrakenExchangeConnectivityStateRow): DurableKrakenExchangeConnectivityState {
  if (row.schemaVersion !== KRAKEN_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported Kraken exchange connectivity schema version: ${row.schemaVersion}`,
    );
  }

  if (row.exchangeIdentifier !== KRAKEN_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER) {
    throw new Error(
      `Unsupported Kraken exchange connectivity exchange identifier: ${row.exchangeIdentifier}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    schemaVersion: row.schemaVersion,
    exchangeIdentifier: KRAKEN_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
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
