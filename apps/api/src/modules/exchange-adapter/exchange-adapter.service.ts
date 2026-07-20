import { Injectable } from '@nestjs/common';
import type { ExchangeCapabilities } from './domain/exchange-capabilities';
import type { ExchangeConnection } from './domain/exchange-connection';
import type { ExchangeId } from './domain/exchange-id';
import type {
  ExchangeBalance,
  ExchangeExecution,
  ExchangePosition,
  ExchangeTicker,
} from './domain/exchange-market';
import type {
  ExchangeCancelRequest,
  ExchangeOrderRequest,
  ExchangeOrderResponse,
  ExchangeOrderSnapshot,
} from './domain/exchange-order';
import { ExchangeManager, type ExchangeClock } from './exchange-manager';

export type ExchangeView = Readonly<{
  exchangeId: ExchangeId;
  capabilities: ExchangeCapabilities;
  connection: ExchangeConnectionView | null;
}>;

export type ExchangeConnectionView = Readonly<{
  id: string;
  exchangeId: ExchangeId;
  status: string;
  latencyMs: number | null;
  lastHeartbeatAt: string | null;
  lastSynchronizedAt: string | null;
  apiPermissions: readonly string[];
  supportedMarkets: readonly string[];
  capabilities: ExchangeCapabilities;
  createdAt: string;
  updatedAt: string;
}>;

export type ExchangeStatusView = Readonly<{
  exchanges: readonly ExchangeView[];
  connectedCount: number;
  totalCount: number;
}>;

/**
 * Application facade for Exchange Adapter Layer REST API (US209).
 */
@Injectable()
export class ExchangeAdapterService {
  constructor(private readonly manager: ExchangeManager) {}

  setClock(clock: ExchangeClock): void {
    this.manager.setClock(clock);
  }

  async listExchanges(workspaceId: string): Promise<ExchangeView[]> {
    const registered = this.manager.listRegistered();
    const connections = await this.manager.listConnections(workspaceId);
    const byExchange = new Map(connections.map((c) => [c.exchangeId, c]));

    return registered.map((entry) => {
      const connection = byExchange.get(entry.exchangeId) ?? null;
      return Object.freeze({
        exchangeId: entry.exchangeId,
        capabilities: entry.capabilities,
        connection: connection ? toConnectionView(connection) : null,
      });
    });
  }

  async getStatus(workspaceId: string): Promise<ExchangeStatusView> {
    const exchanges = await this.listExchanges(workspaceId);
    const connectedCount = exchanges.filter((e) => e.connection?.status === 'CONNECTED').length;
    return Object.freeze({
      exchanges,
      connectedCount,
      totalCount: exchanges.length,
    });
  }

  async getExchange(workspaceId: string, exchangeId: string): Promise<ExchangeView> {
    const capabilities = this.manager.getCapabilities(exchangeId);
    const connection = await this.manager.getConnectionByExchange(workspaceId, exchangeId);
    const id = connection?.exchangeId ?? (exchangeId.toUpperCase() as ExchangeId);
    return Object.freeze({
      exchangeId: id,
      capabilities,
      connection: connection ? toConnectionView(connection) : null,
    });
  }

  async getCapabilities(workspaceId: string, exchangeId: string): Promise<ExchangeCapabilities> {
    void workspaceId;
    return this.manager.getCapabilities(exchangeId);
  }

  async connect(workspaceId: string, exchangeId: string): Promise<ExchangeConnectionView> {
    const connection = await this.manager.connect(workspaceId, exchangeId);
    return toConnectionView(connection);
  }

  async disconnect(
    workspaceId: string,
    exchangeId: string,
    reason?: string | null,
  ): Promise<ExchangeConnectionView> {
    const connection = await this.manager.disconnect(workspaceId, exchangeId, reason ?? null);
    return toConnectionView(connection);
  }

  async submitOrder(
    workspaceId: string,
    exchangeId: string,
    order: ExchangeOrderRequest,
  ): Promise<ExchangeOrderResponse> {
    return this.manager.submitOrder(workspaceId, exchangeId, order);
  }

  async cancelOrder(
    workspaceId: string,
    exchangeId: string,
    request: ExchangeCancelRequest,
  ): Promise<ExchangeOrderResponse> {
    return this.manager.cancelOrder(workspaceId, exchangeId, request);
  }

  async getOrder(
    workspaceId: string,
    exchangeId: string,
    exchangeOrderId: string,
  ): Promise<ExchangeOrderSnapshot | null> {
    return this.manager.getOrder(workspaceId, exchangeId, exchangeOrderId);
  }

  async getBalances(workspaceId: string, exchangeId: string): Promise<readonly ExchangeBalance[]> {
    return this.manager.getBalances(workspaceId, exchangeId);
  }

  async getPositions(
    workspaceId: string,
    exchangeId: string,
  ): Promise<readonly ExchangePosition[]> {
    return this.manager.getPositions(workspaceId, exchangeId);
  }

  async getMarketPrice(
    workspaceId: string,
    exchangeId: string,
    symbol: string,
  ): Promise<ExchangeTicker> {
    return this.manager.getMarketPrice(workspaceId, exchangeId, symbol);
  }

  async synchronizeExecutions(
    workspaceId: string,
    exchangeId: string,
  ): Promise<readonly ExchangeExecution[]> {
    return this.manager.synchronizeExecutions(workspaceId, exchangeId);
  }

  async heartbeat(workspaceId: string, exchangeId: string): Promise<ExchangeConnectionView> {
    return toConnectionView(await this.manager.heartbeat(workspaceId, exchangeId));
  }
}

function toConnectionView(connection: ExchangeConnection): ExchangeConnectionView {
  return Object.freeze({
    id: connection.id,
    exchangeId: connection.exchangeId,
    status: connection.status,
    latencyMs: connection.latencyMs,
    lastHeartbeatAt: connection.lastHeartbeatAt,
    lastSynchronizedAt: connection.lastSynchronizedAt,
    apiPermissions: connection.apiPermissions,
    supportedMarkets: connection.supportedMarkets,
    capabilities: connection.capabilities,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  });
}
