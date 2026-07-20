import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ExchangeCapabilities } from './domain/exchange-capabilities';
import {
  createExchangeConnection,
  withConnectionStatus,
  withHeartbeat,
  withSynchronization,
  type ExchangeConnection,
} from './domain/exchange-connection';
import { assertExchangeId, type ExchangeId } from './domain/exchange-id';
import type {
  ExchangeBalance,
  ExchangeExecution,
  ExchangePosition,
  ExchangeTicker,
} from './domain/exchange-market';
import {
  createExchangeOrderRequest,
  type ExchangeCancelRequest,
  type ExchangeOrderRequest,
  type ExchangeOrderResponse,
  type ExchangeOrderSnapshot,
} from './domain/exchange-order';
import {
  ExchangeAlreadyConnectedError,
  ExchangeConnectionFailedError,
  ExchangeNotConnectedError,
  ExchangeNotFoundError,
  ExchangeValidationError,
} from './exchange-adapter-errors';

function parseExchangeId(value: string): ExchangeId {
  try {
    return assertExchangeId(value);
  } catch (error) {
    throw new ExchangeValidationError(
      error instanceof Error ? error.message : 'invalid exchange id',
      error,
    );
  }
}
import type { ExchangeDomainEvent } from './exchange-adapter-events';
import {
  EXCHANGE_ADAPTER_REPOSITORY,
  type ExchangeAdapterRepository,
} from './exchange-adapter.repository';
import type { ExchangeAdapter } from './exchange-adapter.port';
import { ExchangeEventPublisher } from './exchange-event-publisher';
import { ExchangeFactory } from './exchange-factory';
import { ExchangeRegistry } from './exchange-registry';
import { ExchangeRouter } from './exchange-router';
import type { VenueExchangeAdapter } from './adapters/venue.adapters';

export type ExchangeClock = Readonly<{ now(): string }>;

/**
 * Exchange Manager (US209): connection lifecycle, order translation routing, event emission.
 * Does not mutate Portfolio / Position / Order / Risk.
 */
@Injectable()
export class ExchangeManager implements OnModuleInit {
  private clock: ExchangeClock = { now: () => new Date().toISOString() };

  constructor(
    private readonly factory: ExchangeFactory,
    private readonly registry: ExchangeRegistry,
    private readonly router: ExchangeRouter,
    private readonly events: ExchangeEventPublisher,
    @Inject(EXCHANGE_ADAPTER_REPOSITORY)
    private readonly repository: ExchangeAdapterRepository,
  ) {}

  setClock(clock: ExchangeClock): void {
    this.clock = clock;
  }

  onModuleInit(): void {
    this.factory.ensureAllRegistered();
  }

  listRegistered(): readonly {
    exchangeId: ExchangeId;
    capabilities: ExchangeCapabilities;
  }[] {
    this.factory.ensureAllRegistered();
    return Object.freeze(
      this.registry.list().map((entry) =>
        Object.freeze({
          exchangeId: entry.exchangeId,
          capabilities: entry.capabilities,
        }),
      ),
    );
  }

  getCapabilities(exchangeId: string): ExchangeCapabilities {
    const id = parseExchangeId(exchangeId);
    this.factory.create(id);
    return this.registry.getCapabilities(id);
  }

  async listConnections(workspaceId: string): Promise<ExchangeConnection[]> {
    this.factory.ensureAllRegistered();
    return this.repository.listConnectionsByWorkspaceId(workspaceId);
  }

  async getConnection(workspaceId: string, connectionId: string): Promise<ExchangeConnection> {
    const connection = await this.repository.findConnectionById(connectionId);
    if (!connection || connection.workspaceId !== workspaceId) {
      throw new ExchangeNotFoundError(`exchange connection not found: ${connectionId}`);
    }
    return connection;
  }

  async getConnectionByExchange(
    workspaceId: string,
    exchangeId: string,
  ): Promise<ExchangeConnection | null> {
    const id = parseExchangeId(exchangeId);
    return this.repository.findConnectionByWorkspaceAndExchange(workspaceId, id);
  }

  async connect(workspaceId: string, exchangeId: string): Promise<ExchangeConnection> {
    const id = parseExchangeId(exchangeId);
    const ws = required(workspaceId, 'workspaceId');
    const adapter = this.factory.create(id);
    const now = this.clock.now();

    let connection = await this.repository.findConnectionByWorkspaceAndExchange(ws, id);
    if (connection?.status === 'CONNECTED' && adapter.isConnected()) {
      throw new ExchangeAlreadyConnectedError(`${id} is already connected`);
    }

    if (!connection) {
      connection = createExchangeConnection({
        id: randomUUID(),
        workspaceId: ws,
        exchangeId: id,
        capabilities: adapter.capabilities(),
        apiPermissions: this.readApiPermissions(adapter),
        supportedMarkets: this.readSupportedMarkets(adapter),
        createdAt: now,
        updatedAt: now,
      });
      connection = await this.repository.createConnection(connection);
    }

    connection = withConnectionStatus(connection, 'CONNECTING', now);
    connection = await this.repository.saveConnection(connection);

    try {
      await adapter.connect();
      const latencyMs = adapter.ping ? await adapter.ping() : 0;
      connection = withHeartbeat(
        withConnectionStatus(connection, 'CONNECTED', this.clock.now()),
        this.clock.now(),
        latencyMs,
      );
      connection = await this.repository.saveConnection(connection);

      await this.events.publish({
        eventType: 'ExchangeConnected',
        connectionId: connection.id,
        exchangeId: id,
        occurredAt: this.clock.now(),
        capabilities: adapter.capabilities(),
      });

      return connection;
    } catch (error) {
      connection = withConnectionStatus(connection, 'ERROR', this.clock.now());
      await this.repository.saveConnection(connection);
      throw new ExchangeConnectionFailedError(
        `failed to connect ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  async disconnect(
    workspaceId: string,
    exchangeId: string,
    reason: string | null = null,
  ): Promise<ExchangeConnection> {
    const id = parseExchangeId(exchangeId);
    const ws = required(workspaceId, 'workspaceId');
    const adapter = this.factory.create(id);
    const connection = await this.repository.findConnectionByWorkspaceAndExchange(ws, id);
    if (!connection) {
      throw new ExchangeNotFoundError(`no connection for ${id}`);
    }

    await adapter.disconnect();
    const updated = await this.repository.saveConnection(
      withConnectionStatus(connection, 'DISCONNECTED', this.clock.now()),
    );

    await this.events.publish({
      eventType: 'ExchangeDisconnected',
      connectionId: updated.id,
      exchangeId: id,
      occurredAt: this.clock.now(),
      reason,
    });

    return updated;
  }

  async heartbeat(workspaceId: string, exchangeId: string): Promise<ExchangeConnection> {
    const id = parseExchangeId(exchangeId);
    const adapter = this.router.resolve(id);
    const connection = await this.requireConnection(workspaceId, id);
    const latencyMs = adapter.ping ? await adapter.ping() : 0;
    const updated = await this.repository.saveConnection(
      withHeartbeat(connection, this.clock.now(), latencyMs),
    );
    await this.events.publish({
      eventType: 'HeartbeatReceived',
      connectionId: updated.id,
      exchangeId: id,
      occurredAt: this.clock.now(),
      latencyMs,
    });
    return updated;
  }

  async submitOrder(
    workspaceId: string,
    exchangeId: string,
    raw: ExchangeOrderRequest,
  ): Promise<ExchangeOrderResponse> {
    const id = parseExchangeId(exchangeId);
    const connection = await this.requireConnected(workspaceId, id);
    let request: ExchangeOrderRequest;
    try {
      request = createExchangeOrderRequest(raw);
    } catch (error) {
      throw new ExchangeValidationError(
        error instanceof Error ? error.message : 'invalid order request',
        error,
      );
    }

    const response = await this.router.submitOrder(id, request);
    const now = this.clock.now();

    if (!response.accepted || !response.order) {
      await this.events.publish({
        eventType: 'OrderRejected',
        connectionId: connection.id,
        exchangeId: id,
        occurredAt: now,
        clientOrderId: request.clientOrderId,
        reason: response.rejectReason ?? 'rejected by exchange',
      });
      return response;
    }

    await this.events.publish({
      eventType: 'OrderAccepted',
      connectionId: connection.id,
      exchangeId: id,
      occurredAt: now,
      order: response.order,
    });

    if (response.order.status === 'FILLED') {
      await this.events.publish({
        eventType: 'OrderFilled',
        connectionId: connection.id,
        exchangeId: id,
        occurredAt: now,
        order: response.order,
      });
      const executions = await this.router.synchronizeExecutions(id);
      for (const execution of executions) {
        if (execution.exchangeOrderId !== response.order.exchangeOrderId) continue;
        await this.events.publish({
          eventType: 'ExecutionReceived',
          connectionId: connection.id,
          exchangeId: id,
          occurredAt: this.clock.now(),
          execution,
        });
      }
    }

    return response;
  }

  async cancelOrder(
    workspaceId: string,
    exchangeId: string,
    request: ExchangeCancelRequest,
  ): Promise<ExchangeOrderResponse> {
    const id = parseExchangeId(exchangeId);
    const connection = await this.requireConnected(workspaceId, id);
    const response = await this.router.cancelOrder(id, request);
    if (response.accepted && response.order) {
      await this.events.publish({
        eventType: 'OrderCancelled',
        connectionId: connection.id,
        exchangeId: id,
        occurredAt: this.clock.now(),
        order: response.order,
      });
    }
    return response;
  }

  async getOrder(
    workspaceId: string,
    exchangeId: string,
    exchangeOrderId: string,
  ): Promise<ExchangeOrderSnapshot | null> {
    const id = parseExchangeId(exchangeId);
    await this.requireConnected(workspaceId, id);
    return this.router.getOrder(id, exchangeOrderId);
  }

  async getBalances(workspaceId: string, exchangeId: string): Promise<readonly ExchangeBalance[]> {
    const id = parseExchangeId(exchangeId);
    const connection = await this.requireConnected(workspaceId, id);
    const balances = await this.router.getBalances(id);
    await this.events.publish({
      eventType: 'BalanceUpdated',
      connectionId: connection.id,
      exchangeId: id,
      occurredAt: this.clock.now(),
      balances,
    });
    return balances;
  }

  async getPositions(
    workspaceId: string,
    exchangeId: string,
  ): Promise<readonly ExchangePosition[]> {
    const id = parseExchangeId(exchangeId);
    const connection = await this.requireConnected(workspaceId, id);
    const positions = await this.router.getPositions(id);
    await this.events.publish({
      eventType: 'PositionUpdated',
      connectionId: connection.id,
      exchangeId: id,
      occurredAt: this.clock.now(),
      positions,
    });
    return positions;
  }

  async getMarketPrice(
    workspaceId: string,
    exchangeId: string,
    symbol: string,
  ): Promise<ExchangeTicker> {
    const id = parseExchangeId(exchangeId);
    const connection = await this.requireConnected(workspaceId, id);
    const ticker = await this.router.getMarketPrice(id, symbol);
    await this.events.publish({
      eventType: 'TickerUpdated',
      connectionId: connection.id,
      exchangeId: id,
      occurredAt: this.clock.now(),
      ticker,
    });
    return ticker;
  }

  async synchronizeExecutions(
    workspaceId: string,
    exchangeId: string,
  ): Promise<readonly ExchangeExecution[]> {
    const id = parseExchangeId(exchangeId);
    const connection = await this.requireConnected(workspaceId, id);
    const executions = await this.router.synchronizeExecutions(id);
    for (const execution of executions) {
      await this.events.publish({
        eventType: 'ExecutionReceived',
        connectionId: connection.id,
        exchangeId: id,
        occurredAt: this.clock.now(),
        execution,
      });
    }
    await this.repository.saveConnection(withSynchronization(connection, this.clock.now()));
    return executions;
  }

  getPublishedEvents(): readonly ExchangeDomainEvent[] {
    return this.events.getPublishedEvents();
  }

  private async requireConnection(
    workspaceId: string,
    exchangeId: ExchangeId,
  ): Promise<ExchangeConnection> {
    const connection = await this.repository.findConnectionByWorkspaceAndExchange(
      workspaceId,
      exchangeId,
    );
    if (!connection) {
      throw new ExchangeNotFoundError(`no connection for ${exchangeId}`);
    }
    return connection;
  }

  private async requireConnected(
    workspaceId: string,
    exchangeId: ExchangeId,
  ): Promise<ExchangeConnection> {
    const connection = await this.requireConnection(workspaceId, exchangeId);
    if (connection.status !== 'CONNECTED') {
      throw new ExchangeNotConnectedError(
        `${exchangeId} connection status is ${connection.status}`,
      );
    }
    this.router.resolve(exchangeId);
    return connection;
  }

  private readApiPermissions(adapter: ExchangeAdapter): readonly string[] {
    if (
      'apiPermissions' in adapter &&
      typeof (adapter as VenueExchangeAdapter).apiPermissions === 'function'
    ) {
      return (adapter as VenueExchangeAdapter).apiPermissions();
    }
    return Object.freeze(['spot.read', 'spot.trade']);
  }

  private readSupportedMarkets(adapter: ExchangeAdapter): readonly string[] {
    if (
      'supportedMarkets' in adapter &&
      typeof (adapter as VenueExchangeAdapter).supportedMarkets === 'function'
    ) {
      return (adapter as VenueExchangeAdapter).supportedMarkets();
    }
    return Object.freeze(['spot']);
  }
}

function required(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new ExchangeValidationError(`${label} is required`);
  return trimmed;
}
