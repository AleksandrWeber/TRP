import { Injectable } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';
import { rehydrateExchangeConnection, type ExchangeConnection } from './domain/exchange-connection';
import type { ExchangeCapabilities } from './domain/exchange-capabilities';
import type { ExchangeId } from './domain/exchange-id';
import type { ConnectionStatus } from './domain/connection-status';
import type { ExchangeDomainEvent } from './exchange-adapter-events';
import type { ExchangeAdapterRepository } from './exchange-adapter.repository';

@Injectable()
export class PrismaExchangeAdapterRepository implements ExchangeAdapterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createConnection(connection: ExchangeConnection): Promise<ExchangeConnection> {
    const row = await this.prisma.exchangeConnection.create({
      data: toConnectionRow(connection),
    });
    return fromConnectionRow(row);
  }

  async saveConnection(connection: ExchangeConnection): Promise<ExchangeConnection> {
    const row = await this.prisma.exchangeConnection.update({
      where: { id: connection.id },
      data: {
        status: connection.status,
        latencyMs: connection.latencyMs,
        lastHeartbeatAt: connection.lastHeartbeatAt ? new Date(connection.lastHeartbeatAt) : null,
        lastSynchronizedAt: connection.lastSynchronizedAt
          ? new Date(connection.lastSynchronizedAt)
          : null,
        apiPermissions: connection.apiPermissions as unknown as Prisma.InputJsonValue,
        supportedMarkets: connection.supportedMarkets as unknown as Prisma.InputJsonValue,
        capabilities: connection.capabilities as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(connection.updatedAt),
      },
    });
    return fromConnectionRow(row);
  }

  async findConnectionById(connectionId: string): Promise<ExchangeConnection | null> {
    const row = await this.prisma.exchangeConnection.findUnique({
      where: { id: connectionId },
    });
    return row ? fromConnectionRow(row) : null;
  }

  async findConnectionByWorkspaceAndExchange(
    workspaceId: string,
    exchangeId: string,
  ): Promise<ExchangeConnection | null> {
    const row = await this.prisma.exchangeConnection.findUnique({
      where: {
        workspaceId_exchangeId: { workspaceId, exchangeId },
      },
    });
    return row ? fromConnectionRow(row) : null;
  }

  async listConnectionsByWorkspaceId(workspaceId: string): Promise<ExchangeConnection[]> {
    const rows = await this.prisma.exchangeConnection.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(fromConnectionRow);
  }

  async appendEvent(event: ExchangeDomainEvent, eventId: string): Promise<void> {
    const { eventType, connectionId, occurredAt, ...rest } = event;
    await this.prisma.exchangeEvent.create({
      data: {
        id: eventId,
        connectionId,
        eventType,
        payload: rest as Prisma.InputJsonValue,
        occurredAt: new Date(occurredAt),
      },
    });
  }

  async listEventsByConnectionId(connectionId: string): Promise<ExchangeDomainEvent[]> {
    const rows = await this.prisma.exchangeEvent.findMany({
      where: { connectionId },
      orderBy: { occurredAt: 'asc' },
    });
    return rows.map((row) => {
      const payload = (row.payload ?? {}) as Record<string, unknown>;
      return Object.freeze({
        eventType: row.eventType,
        connectionId: row.connectionId,
        occurredAt: row.occurredAt.toISOString(),
        ...payload,
      }) as ExchangeDomainEvent;
    });
  }
}

type ConnectionRow = {
  id: string;
  workspaceId: string;
  exchangeId: string;
  status: string;
  latencyMs: number | null;
  lastHeartbeatAt: Date | null;
  lastSynchronizedAt: Date | null;
  apiPermissions: Prisma.JsonValue;
  supportedMarkets: Prisma.JsonValue;
  capabilities: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

function toConnectionRow(connection: ExchangeConnection) {
  return {
    id: connection.id,
    workspaceId: connection.workspaceId,
    exchangeId: connection.exchangeId,
    status: connection.status,
    latencyMs: connection.latencyMs,
    lastHeartbeatAt: connection.lastHeartbeatAt ? new Date(connection.lastHeartbeatAt) : null,
    lastSynchronizedAt: connection.lastSynchronizedAt
      ? new Date(connection.lastSynchronizedAt)
      : null,
    apiPermissions: connection.apiPermissions as unknown as Prisma.InputJsonValue,
    supportedMarkets: connection.supportedMarkets as unknown as Prisma.InputJsonValue,
    capabilities: connection.capabilities as unknown as Prisma.InputJsonValue,
    createdAt: new Date(connection.createdAt),
    updatedAt: new Date(connection.updatedAt),
  };
}

function fromConnectionRow(row: ConnectionRow): ExchangeConnection {
  return rehydrateExchangeConnection({
    id: row.id,
    workspaceId: row.workspaceId,
    exchangeId: row.exchangeId as ExchangeId,
    status: row.status as ConnectionStatus,
    latencyMs: row.latencyMs,
    lastHeartbeatAt: row.lastHeartbeatAt ? row.lastHeartbeatAt.toISOString() : null,
    lastSynchronizedAt: row.lastSynchronizedAt ? row.lastSynchronizedAt.toISOString() : null,
    apiPermissions: asStringArray(row.apiPermissions),
    supportedMarkets: asStringArray(row.supportedMarkets),
    capabilities: row.capabilities as ExchangeCapabilities,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function asStringArray(value: Prisma.JsonValue): readonly string[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  return Object.freeze(value.map((v) => String(v)));
}
