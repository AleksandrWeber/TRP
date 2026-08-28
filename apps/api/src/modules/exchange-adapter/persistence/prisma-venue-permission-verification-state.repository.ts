import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  VENUE_PERMISSION_VERIFICATION_STATE_SCHEMA_VERSION,
  type DurableVenuePermissionVerificationState,
} from '../domain/durable-venue-permission-verification-state';
import type { VenuePermissionVerificationStateRepository } from '../domain/venue-permission-verification-state.repository';

type VenuePermissionVerificationStateRow =
  Prisma.WorkspaceVenuePermissionVerificationStateGetPayload<Record<string, never>>;

export class PrismaVenuePermissionVerificationStateRepository implements VenuePermissionVerificationStateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveVenuePermissionVerificationState(
    state: DurableVenuePermissionVerificationState,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(state);
    await client.workspaceVenuePermissionVerificationState.upsert({
      where: {
        workspaceId_exchangeIdentifier: {
          workspaceId: state.workspaceId,
          exchangeIdentifier: state.exchangeIdentifier,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadVenuePermissionVerificationState(
    workspaceId: string,
    exchangeIdentifier: string,
  ): Promise<DurableVenuePermissionVerificationState | null> {
    const row = await this.prisma.workspaceVenuePermissionVerificationState.findUnique({
      where: {
        workspaceId_exchangeIdentifier: {
          workspaceId,
          exchangeIdentifier,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllVenuePermissionVerificationStates(): Promise<
    readonly DurableVenuePermissionVerificationState[]
  > {
    const rows = await this.prisma.workspaceVenuePermissionVerificationState.findMany({
      orderBy: [{ workspaceId: 'asc' }, { exchangeIdentifier: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  state: DurableVenuePermissionVerificationState,
): Prisma.WorkspaceVenuePermissionVerificationStateUncheckedCreateInput {
  return {
    workspaceId: state.workspaceId,
    exchangeIdentifier: state.exchangeIdentifier,
    schemaVersion: state.schemaVersion,
    connectionId: state.connectionId,
    adapterExchangeConnectionId: state.adapterExchangeConnectionId,
    permissionVerificationId: state.permissionVerificationId,
    vendorPermissionHash: state.vendorPermissionHash,
    integrityMetadataHash: state.integrityMetadataHash,
    correlationId: state.correlationId,
    updatedAt: new Date(state.updatedAt),
  };
}

function toDomain(
  row: VenuePermissionVerificationStateRow,
): DurableVenuePermissionVerificationState {
  if (row.schemaVersion !== VENUE_PERMISSION_VERIFICATION_STATE_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported venue permission verification schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    schemaVersion: row.schemaVersion,
    exchangeIdentifier: row.exchangeIdentifier,
    connectionId: row.connectionId,
    adapterExchangeConnectionId: row.adapterExchangeConnectionId,
    permissionVerificationId: row.permissionVerificationId,
    vendorPermissionHash: row.vendorPermissionHash,
    integrityMetadataHash: row.integrityMetadataHash,
    correlationId: row.correlationId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
