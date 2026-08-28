import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  OKX_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
  OKX_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION,
  type DurableOkxExchangeConnectivityState,
} from '../domain/durable-okx-exchange-connectivity-state';
import type { OkxExchangeConnectivityStateRepository } from '../domain/okx-exchange-connectivity-state.repository';
import { assertRecoverableOkxExchangeConnectivityState } from '../domain/okx-exchange-connectivity-restart-recovery';

type OkxExchangeConnectivityStateRow = Prisma.WorkspaceOkxExchangeConnectivityStateGetPayload<
  Record<string, never>
>;

export class PrismaOkxExchangeConnectivityStateRepository implements OkxExchangeConnectivityStateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveOkxExchangeConnectivityState(
    state: DurableOkxExchangeConnectivityState,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(state);
    await client.workspaceOkxExchangeConnectivityState.upsert({
      where: { workspaceId: state.workspaceId },
      create: data,
      update: data,
    });
  }

  async loadOkxExchangeConnectivityState(
    workspaceId: string,
  ): Promise<DurableOkxExchangeConnectivityState | null> {
    const row = await this.prisma.workspaceOkxExchangeConnectivityState.findUnique({
      where: { workspaceId },
    });
    return row ? toDomain(row) : null;
  }

  async listAllOkxExchangeConnectivityStates(): Promise<
    readonly DurableOkxExchangeConnectivityState[]
  > {
    const rows = await this.prisma.workspaceOkxExchangeConnectivityState.findMany({
      orderBy: { workspaceId: 'asc' },
    });
    return Object.freeze(
      rows.map((row, index) => assertRecoverableOkxExchangeConnectivityState(toDomain(row), index)),
    );
  }
}

function toRow(
  state: DurableOkxExchangeConnectivityState,
): Prisma.WorkspaceOkxExchangeConnectivityStateUncheckedCreateInput {
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

function toDomain(row: OkxExchangeConnectivityStateRow): DurableOkxExchangeConnectivityState {
  if (row.schemaVersion !== OKX_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION) {
    throw new Error(`Unsupported Okx exchange connectivity schema version: ${row.schemaVersion}`);
  }

  if (row.exchangeIdentifier !== OKX_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER) {
    throw new Error(
      `Unsupported Okx exchange connectivity exchange identifier: ${row.exchangeIdentifier}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    schemaVersion: row.schemaVersion,
    exchangeIdentifier: OKX_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
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
