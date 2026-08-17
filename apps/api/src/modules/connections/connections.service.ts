import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../storage/prisma/prisma.module';
import {
  ExchangeCapabilityService,
  ExchangeHandshakeService,
  ExchangeSessionService,
  IllegalExchangeSessionTransitionError,
  lookupExchangeProvider,
  projectExchangeSession,
  type ExchangeCapabilityView,
  type ExchangeProviderMetadata,
  type ExchangeSessionObservation,
  type ExchangeSessionView,
} from '../exchange-connectivity';
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
import { assertConnectionTransition, canStartConnectionValidation } from './connection-lifecycle';
import { ConnectionValidationAudit } from './connection-validation-audit';
import { CONNECTION_VALIDATOR, type ConnectionValidator } from './connection-validator';
import { vaultSecretTypeForProvider } from './connection-vault';

export type ConnectionStatus =
  | 'DISCONNECTED'
  | 'PENDING_VALIDATION'
  | 'CONNECTED'
  | 'VALIDATION_FAILED'
  | 'HANDSHAKE_TIMEOUT'
  | 'PROVIDER_UNAVAILABLE'
  | 'AUTHENTICATION_FAILED'
  | 'SESSION_EXPIRED'
  | 'CONNECTION_LOST'
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
  session: ExchangeSessionView | null;
  capabilities: ExchangeCapabilityView | null;
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
    private readonly handshake: ExchangeHandshakeService,
    private readonly sessions: ExchangeSessionService,
    private readonly capabilities: ExchangeCapabilityService,
  ) {}

  catalog(): ConnectionCatalogView {
    return connectionCatalog();
  }

  async list(workspaceId: string): Promise<ConnectionMetadataView[]> {
    const rows = await this.prisma.connectionRecord.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.view(row));
  }

  async get(workspaceId: string, id: string): Promise<ConnectionMetadataView> {
    return this.view(await this.getRow(workspaceId, id));
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
    return this.view(row);
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
    return this.view(row);
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
    this.capabilities.clear(input.workspaceId, connection.id);
    return this.view(row);
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
    this.capabilities.clear(input.workspaceId, connection.id);
    await this.lifecycleAudit.record({
      outcome: 'credentials_replaced',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: row.id,
      provider: row.provider as ConnectionProvider,
    });
    return this.view(row);
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
    this.capabilities.clear(input.workspaceId, connection.id);
    await this.lifecycleAudit.record({
      outcome: 'revoked',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: row.id,
      provider: row.provider as ConnectionProvider,
    });
    return this.view(row);
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
    if (!canStartConnectionValidation(currentStatus)) {
      throw new ConflictException('Connection cannot be validated from its current state.');
    }

    this.capabilities.clear(input.workspaceId, connection.id);
    const pending = await this.transitionStatus(connection, 'PENDING_VALIDATION');
    if (connection.connectionType === 'EXCHANGE') {
      return this.completeExchangeHandshake(input, pending);
    }
    return this.completeLocalValidation(input, pending);
  }

  async observeSession(input: {
    workspaceId: string;
    actorUserId: string;
    id: string;
    observation: ExchangeSessionObservation;
  }): Promise<ConnectionMetadataView> {
    const connection = await this.getRow(input.workspaceId, input.id);
    if (connection.connectionType !== 'EXCHANGE') {
      throw new ConflictException('Session observations apply only to Exchange connections.');
    }
    const current = connectionStatus(connection.status);
    const session = this.sessions.projection(connection.connectionType, current);
    if (session === null) {
      throw new ConflictException('Exchange session cannot transition to the requested state.');
    }
    try {
      const next = this.sessions.observe(session.state, input.observation);
      const row = await this.transitionStatus(connection, next);
      const actor = {
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        connectionId: row.id,
        provider: row.provider,
      };
      if (input.observation === 'SESSION_EXPIRED') {
        await this.sessions.expired(actor);
      } else if (input.observation === 'CONNECTION_LOST') {
        await this.sessions.connectionLost(actor);
      } else {
        await this.sessions.reconnectRequired(actor);
      }
      this.capabilities.clear(input.workspaceId, row.id);
      return this.view(row);
    } catch (error) {
      if (error instanceof IllegalExchangeSessionTransitionError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  private async completeExchangeHandshake(
    input: {
      workspaceId: string;
      actorUserId: string;
      actorRole: Role;
    },
    pending: ConnectionRow,
  ): Promise<ConnectionMetadataView> {
    try {
      const result = await this.handshake.perform({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        actorRole: input.actorRole,
        connectionId: pending.id,
        provider: pending.provider,
        vaultSecretId: pending.vaultSecretId as string,
      });
      const completed = await this.finishValidation(pending, result.outcome);
      if (result.outcome === 'CONNECTED') {
        await this.sessions
          .established({
            workspaceId: input.workspaceId,
            actorUserId: input.actorUserId,
            connectionId: pending.id,
            provider: pending.provider,
          })
          .catch(() => undefined);
        await this.capabilities
          .verify({
            workspaceId: input.workspaceId,
            actorUserId: input.actorUserId,
            actorRole: input.actorRole,
            connectionId: pending.id,
            provider: pending.provider,
            vaultSecretId: pending.vaultSecretId as string,
            handshakeSucceeded: true,
          })
          .catch(() => undefined);
        return this.view(await this.getRow(input.workspaceId, pending.id));
      }
      return completed;
    } catch {
      return this.finishValidation(pending, 'VALIDATION_FAILED');
    }
  }

  private async completeLocalValidation(
    input: {
      workspaceId: string;
      actorUserId: string;
      actorRole: Role;
    },
    pending: ConnectionRow,
  ): Promise<ConnectionMetadataView> {
    try {
      await this.validationAudit.record({
        outcome: 'started',
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        connectionId: pending.id,
        provider: pending.provider as ConnectionProvider,
      });
      const type = vaultSecretTypeForProvider(pending.provider as ConnectionProvider);
      const metadata = await this.vault.get({
        actorWorkspaceId: input.actorUserId,
        actorRole: input.actorRole,
        workspaceId: input.workspaceId,
        type,
      });
      if (metadata?.id !== pending.vaultSecretId) {
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
        provider: pending.provider as ConnectionProvider,
        credentials,
      });
      const completed = await this.finishValidation(
        pending,
        result.outcome === 'succeeded' ? 'CONNECTED' : 'VALIDATION_FAILED',
      );
      await this.validationAudit.record({
        outcome: result.outcome,
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        connectionId: completed.id,
        provider: completed.provider as ConnectionProvider,
      });
      return completed;
    } catch {
      const failed = await this.finishValidation(pending, 'VALIDATION_FAILED');
      await this.validationAudit.record({
        outcome: 'failed',
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        connectionId: failed.id,
        provider: failed.provider as ConnectionProvider,
      });
      return failed;
    }
  }

  private async transitionLifecycle(
    input: { workspaceId: string; actorUserId: string; id: string },
    status: 'DISCONNECTED' | 'DISABLED',
    outcome: 'disconnected' | 'disabled',
  ): Promise<ConnectionMetadataView> {
    const connection = await this.getRow(input.workspaceId, input.id);
    const row = await this.transitionStatus(connection, status);
    this.capabilities.clear(input.workspaceId, row.id);
    await this.lifecycleAudit.record({
      outcome,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: row.id,
      provider: row.provider as ConnectionProvider,
    });
    return this.view(row);
  }

  private async getRow(workspaceId: string, id: string): Promise<ConnectionRow> {
    const row = await this.prisma.connectionRecord.findFirst({ where: { id, workspaceId } });
    if (!row) throw new NotFoundException('Connection not found');
    return row;
  }

  private async finishValidation(
    pending: ConnectionRow,
    status: ConnectionStatus,
  ): Promise<ConnectionMetadataView> {
    return this.view(await this.transitionStatus(pending, status));
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

  private view(row: ConnectionRow): ConnectionMetadataView {
    const status = connectionStatus(row.status);
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      displayName: row.displayName,
      provider: row.provider as ConnectionProvider,
      connectionType: row.connectionType as ConnectionType,
      status,
      credentialsStored: row.vaultSecretId !== null && status !== 'REVOKED',
      exchangeProvider:
        row.connectionType === 'EXCHANGE' ? (lookupExchangeProvider(row.provider) ?? null) : null,
      session: projectExchangeSession(row.connectionType, status),
      capabilities: this.capabilities.projection(
        row.workspaceId,
        row.id,
        row.connectionType,
        status,
      ),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
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

function connectionStatus(status: string): ConnectionStatus {
  if (
    status === 'DISCONNECTED' ||
    status === 'PENDING_VALIDATION' ||
    status === 'CONNECTED' ||
    status === 'VALIDATION_FAILED' ||
    status === 'HANDSHAKE_TIMEOUT' ||
    status === 'PROVIDER_UNAVAILABLE' ||
    status === 'AUTHENTICATION_FAILED' ||
    status === 'SESSION_EXPIRED' ||
    status === 'CONNECTION_LOST' ||
    status === 'DISABLED' ||
    status === 'REVOKED'
  ) {
    return status;
  }
  return 'DISCONNECTED';
}
