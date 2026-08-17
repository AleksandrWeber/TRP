import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { lookupExchangeProvider, type ExchangeProviderMetadata } from '../exchange-connectivity';
import type { Role } from '../identity/role';
import { SecretVaultService } from '../secret-vault';
import {
  connectionCatalog,
  providerType,
  type ConnectionCatalogView,
  type ConnectionProvider,
  type ConnectionType,
} from './connection-catalog';
import { ConnectionLifecycleAudit } from './connection-lifecycle-audit';
import { assertConnectionTransition } from './connection-lifecycle';
import { ConnectionValidationAudit } from './connection-validation-audit';
import { CONNECTION_VALIDATOR, type ConnectionValidator } from './connection-validator';
import { vaultSecretTypeForProvider } from './connection-vault';

export type ConnectionStatus =
  | 'DISCONNECTED'
  | 'PENDING_VALIDATION'
  | 'CONNECTED'
  | 'VALIDATION_FAILED'
  | 'DISABLED'
  | 'REVOKED';

export type ConnectionMetadataView = {
  id: string;
  workspaceId: string;
  displayName: string;
  provider: ConnectionProvider;
  connectionType: ConnectionType;
  status: ConnectionStatus;
  credentialsStored: boolean;
  exchangeProvider: ExchangeProviderMetadata | null;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vault: SecretVaultService,
    @Inject(CONNECTION_VALIDATOR)
    private readonly validator: ConnectionValidator,
    private readonly validationAudit: ConnectionValidationAudit,
    private readonly lifecycleAudit: ConnectionLifecycleAudit,
  ) {}

  catalog(): ConnectionCatalogView {
    return connectionCatalog();
  }

  async list(workspaceId: string): Promise<ConnectionMetadataView[]> {
    const rows = await this.prisma.connectionRecord.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toView);
  }

  async get(workspaceId: string, id: string): Promise<ConnectionMetadataView> {
    return toView(await this.getRow(workspaceId, id));
  }

  async create(input: {
    workspaceId: string;
    displayName: string;
    provider: string;
  }): Promise<ConnectionMetadataView> {
    const connectionType = providerType(input.provider);
    if (!connectionType) {
      throw new NotFoundException('Offered provider not found');
    }
    if (connectionType === 'EXCHANGE' && lookupExchangeProvider(input.provider) === null) {
      throw new NotFoundException('Offered provider not found');
    }
    const now = new Date();
    const row = await this.prisma.connectionRecord.create({
      data: {
        id: randomUUID(),
        workspaceId: input.workspaceId,
        displayName: input.displayName.trim(),
        provider: input.provider,
        connectionType,
        status: 'DISCONNECTED',
        createdAt: now,
      },
    });
    return toView(row);
  }

  async rename(
    workspaceId: string,
    id: string,
    displayName: string,
  ): Promise<ConnectionMetadataView> {
    await this.getRow(workspaceId, id);
    const row = await this.prisma.connectionRecord.update({
      where: { id },
      data: { displayName: displayName.trim() },
    });
    return toView(row);
  }

  async storeCredentials(input: {
    workspaceId: string;
    actorUserId: string;
    actorRole: Role;
    id: string;
    credentials: Record<string, string>;
  }): Promise<ConnectionMetadataView> {
    const connection = await this.getRow(input.workspaceId, input.id);
    const status = connectionStatus(connection.status);
    if (status === 'DISABLED') {
      throw new ConflictException('Disabled connections cannot store credentials.');
    }
    if (connection.vaultSecretId !== null && status !== 'REVOKED') {
      throw new ConflictException('Credentials are already stored. Use replace credentials.');
    }
    if (status === 'REVOKED') {
      await this.assertRevokedCredentialSlotAvailable(
        connection,
        input.actorUserId,
        input.actorRole,
      );
    } else {
      await this.assertCredentialSlotAvailable(connection, input.actorUserId, input.actorRole);
    }
    const stored = await this.vault.store({
      actorWorkspaceId: input.actorUserId,
      actorRole: input.actorRole,
      workspaceId: input.workspaceId,
      type: vaultSecretTypeForProvider(connection.provider as ConnectionProvider),
      fields: input.credentials,
    });
    if (status === 'REVOKED') {
      assertConnectionTransition(status, 'DISCONNECTED');
    }
    const row = await this.prisma.connectionRecord.update({
      where: { id: connection.id },
      data: { vaultSecretId: stored.metadata.id, status: 'DISCONNECTED' },
    });
    return toView(row);
  }

  async replaceCredentials(input: {
    workspaceId: string;
    actorUserId: string;
    actorRole: Role;
    id: string;
    credentials: Record<string, string>;
  }): Promise<ConnectionMetadataView> {
    const connection = await this.getRow(input.workspaceId, input.id);
    const status = connectionStatus(connection.status);
    if (connection.vaultSecretId === null) {
      throw new ConflictException('Credentials have not been stored for this connection.');
    }
    if (status !== 'DISCONNECTED') {
      assertConnectionTransition(status, 'DISCONNECTED');
    }
    const stored = await this.vault.replace({
      actorWorkspaceId: input.actorUserId,
      actorRole: input.actorRole,
      workspaceId: input.workspaceId,
      type: vaultSecretTypeForProvider(connection.provider as ConnectionProvider),
      fields: input.credentials,
    });
    if (stored.metadata.id !== connection.vaultSecretId) {
      throw new ConflictException('Credential ownership could not be verified.');
    }
    const row = await this.prisma.connectionRecord.update({
      where: { id: connection.id },
      data: { vaultSecretId: stored.metadata.id, status: 'DISCONNECTED' },
    });
    await this.lifecycleAudit.record({
      outcome: 'credentials_replaced',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: row.id,
      provider: row.provider as ConnectionProvider,
    });
    return toView(row);
  }

  async disconnect(input: {
    workspaceId: string;
    actorUserId: string;
    id: string;
  }): Promise<ConnectionMetadataView> {
    return this.transitionLifecycle(input, 'DISCONNECTED', 'disconnected');
  }

  async disable(input: {
    workspaceId: string;
    actorUserId: string;
    id: string;
  }): Promise<ConnectionMetadataView> {
    return this.transitionLifecycle(input, 'DISABLED', 'disabled');
  }

  async revoke(input: {
    workspaceId: string;
    actorUserId: string;
    actorRole: Role;
    id: string;
  }): Promise<ConnectionMetadataView> {
    const connection = await this.getRow(input.workspaceId, input.id);
    const status = connectionStatus(connection.status);
    assertConnectionTransition(status, 'REVOKED');
    if (connection.vaultSecretId === null) {
      throw new ConflictException('Credentials have not been stored for this connection.');
    }
    const type = vaultSecretTypeForProvider(connection.provider as ConnectionProvider);
    const metadata = await this.vault.get({
      actorWorkspaceId: input.actorUserId,
      actorRole: input.actorRole,
      workspaceId: input.workspaceId,
      type,
    });
    if (metadata?.id !== connection.vaultSecretId) {
      throw new ConflictException('Credential ownership could not be verified.');
    }
    await this.vault.revoke({
      actorWorkspaceId: input.actorUserId,
      actorRole: input.actorRole,
      workspaceId: input.workspaceId,
      type,
    });
    const row = await this.updateStatus(connection.id, 'REVOKED');
    await this.lifecycleAudit.record({
      outcome: 'revoked',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: row.id,
      provider: row.provider as ConnectionProvider,
    });
    return toView(row);
  }

  async validate(input: {
    workspaceId: string;
    actorUserId: string;
    actorRole: Role;
    id: string;
  }): Promise<ConnectionMetadataView> {
    const connection = await this.getRow(input.workspaceId, input.id);
    if (connection.vaultSecretId === null) {
      throw new ConflictException('Credentials have not been stored for this connection.');
    }
    const currentStatus = connectionStatus(connection.status);
    if (currentStatus !== 'DISCONNECTED' && currentStatus !== 'VALIDATION_FAILED') {
      throw new ConflictException('Connection cannot be validated from its current state.');
    }

    const pending = await this.transitionStatus(connection, 'PENDING_VALIDATION');
    try {
      await this.validationAudit.record({
        outcome: 'started',
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        connectionId: connection.id,
        provider: connection.provider as ConnectionProvider,
      });
      const type = vaultSecretTypeForProvider(connection.provider as ConnectionProvider);
      const metadata = await this.vault.get({
        actorWorkspaceId: input.actorUserId,
        actorRole: input.actorRole,
        workspaceId: input.workspaceId,
        type,
      });
      if (metadata?.id !== connection.vaultSecretId) {
        throw new Error('Vault credential reference could not be verified.');
      }
      const credentials = await this.vault.retrieve({
        actorWorkspaceId: input.actorUserId,
        actorRole: input.actorRole,
        workspaceId: input.workspaceId,
        type,
      });
      const result = await this.validator.validate({
        workspaceId: input.workspaceId,
        connectionId: pending.id,
        provider: connection.provider as ConnectionProvider,
        credentials,
      });
      return this.completeValidation({
        pending,
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        outcome: result.outcome,
      });
    } catch {
      return this.completeValidation({
        pending,
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        outcome: 'failed',
      });
    }
  }

  private async transitionLifecycle(
    input: { workspaceId: string; actorUserId: string; id: string },
    status: 'DISCONNECTED' | 'DISABLED',
    outcome: 'disconnected' | 'disabled',
  ): Promise<ConnectionMetadataView> {
    const connection = await this.getRow(input.workspaceId, input.id);
    const row = await this.transitionStatus(connection, status);
    await this.lifecycleAudit.record({
      outcome,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: row.id,
      provider: row.provider as ConnectionProvider,
    });
    return toView(row);
  }

  private async getRow(workspaceId: string, id: string): Promise<ConnectionRow> {
    const row = await this.prisma.connectionRecord.findFirst({ where: { id, workspaceId } });
    if (!row) throw new NotFoundException('Connection not found');
    return row;
  }

  private async completeValidation(input: {
    pending: ConnectionRow;
    workspaceId: string;
    actorUserId: string;
    outcome: 'succeeded' | 'failed';
  }): Promise<ConnectionMetadataView> {
    const status: ConnectionStatus =
      input.outcome === 'succeeded' ? 'CONNECTED' : 'VALIDATION_FAILED';
    const completed = await this.transitionStatus(input.pending, status);
    await this.validationAudit.record({
      outcome: input.outcome,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: completed.id,
      provider: completed.provider as ConnectionProvider,
    });
    return toView(completed);
  }

  private async transitionStatus(
    connection: ConnectionRow,
    status: ConnectionStatus,
  ): Promise<ConnectionRow> {
    assertConnectionTransition(connectionStatus(connection.status), status);
    return this.updateStatus(connection.id, status);
  }

  private async updateStatus(id: string, status: ConnectionStatus): Promise<ConnectionRow> {
    return this.prisma.connectionRecord.update({ where: { id }, data: { status } });
  }

  private async assertCredentialSlotAvailable(
    connection: ConnectionRow,
    actorUserId: string,
    actorRole: Role,
  ): Promise<void> {
    const existingConnection = await this.prisma.connectionRecord.findFirst({
      where: {
        workspaceId: connection.workspaceId,
        provider: connection.provider,
        vaultSecretId: { not: null },
      },
    });
    if (existingConnection) {
      throw new ConflictException('Credentials are already assigned to this provider.');
    }
    const existingSecret = await this.vault.get({
      actorWorkspaceId: actorUserId,
      actorRole,
      workspaceId: connection.workspaceId,
      type: vaultSecretTypeForProvider(connection.provider as ConnectionProvider),
    });
    if (existingSecret !== null) {
      throw new ConflictException('Credentials are already assigned to this provider.');
    }
  }

  private async assertRevokedCredentialSlotAvailable(
    connection: ConnectionRow,
    actorUserId: string,
    actorRole: Role,
  ): Promise<void> {
    const existingSecret = await this.vault.get({
      actorWorkspaceId: actorUserId,
      actorRole,
      workspaceId: connection.workspaceId,
      type: vaultSecretTypeForProvider(connection.provider as ConnectionProvider),
    });
    if (existingSecret !== null && existingSecret.id !== connection.vaultSecretId) {
      throw new ConflictException('Credentials are already assigned to this provider.');
    }
  }
}

type ConnectionRow = {
  id: string;
  workspaceId: string;
  displayName: string;
  provider: string;
  connectionType: string;
  vaultSecretId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function toView(row: ConnectionRow): ConnectionMetadataView {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    displayName: row.displayName,
    provider: row.provider as ConnectionProvider,
    connectionType: row.connectionType as ConnectionType,
    status: connectionStatus(row.status),
    credentialsStored: row.vaultSecretId !== null && connectionStatus(row.status) !== 'REVOKED',
    exchangeProvider:
      row.connectionType === 'EXCHANGE' ? (lookupExchangeProvider(row.provider) ?? null) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function connectionStatus(status: string): ConnectionStatus {
  if (
    status === 'DISCONNECTED' ||
    status === 'PENDING_VALIDATION' ||
    status === 'CONNECTED' ||
    status === 'VALIDATION_FAILED' ||
    status === 'DISABLED' ||
    status === 'REVOKED'
  ) {
    return status;
  }
  return 'DISCONNECTED';
}
