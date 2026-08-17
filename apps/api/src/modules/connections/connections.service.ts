import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../storage/prisma/prisma.module';
import {
  connectionCatalog,
  providerType,
  type ConnectionCatalogView,
  type ConnectionProvider,
  type ConnectionType,
} from './connection-catalog';

export type ConnectionMetadataView = {
  id: string;
  workspaceId: string;
  displayName: string;
  provider: ConnectionProvider;
  connectionType: ConnectionType;
  status: 'DISCONNECTED';
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class ConnectionsService {
  constructor(private readonly prisma: PrismaService) {}

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
    const row = await this.prisma.connectionRecord.findFirst({ where: { id, workspaceId } });
    if (!row) throw new NotFoundException('Connection not found');
    return toView(row);
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
    await this.get(workspaceId, id);
    const row = await this.prisma.connectionRecord.update({
      where: { id },
      data: { displayName: displayName.trim() },
    });
    return toView(row);
  }
}

type ConnectionRow = {
  id: string;
  workspaceId: string;
  displayName: string;
  provider: string;
  connectionType: string;
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
    status: 'DISCONNECTED',
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
