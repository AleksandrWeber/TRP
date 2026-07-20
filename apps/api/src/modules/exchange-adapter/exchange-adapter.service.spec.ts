import { beforeEach, describe, expect, it } from 'vitest';
import { MockExchangeAdapter } from './adapters/mock.adapter';
import {
  BinanceExchangeAdapter,
  BybitExchangeAdapter,
  OkxExchangeAdapter,
} from './adapters/venue.adapters';
import { createExchangeCapabilities } from './domain/exchange-capabilities';
import {
  createExchangeConnection,
  withConnectionStatus,
  withHeartbeat,
} from './domain/exchange-connection';
import { createExchangeOrderRequest } from './domain/exchange-order';
import type { ExchangeDomainEvent } from './exchange-adapter-events';
import {
  ExchangeAlreadyConnectedError,
  ExchangeNotConnectedError,
  ExchangeNotFoundError,
  ExchangeOrderRejectedError,
  ExchangeValidationError,
} from './exchange-adapter-errors';
import type { ExchangeAdapterRepository } from './exchange-adapter.repository';
import { ExchangeAdapterService } from './exchange-adapter.service';
import { ExchangeEventPublisher } from './exchange-event-publisher';
import { ExchangeFactory } from './exchange-factory';
import { ExchangeManager } from './exchange-manager';
import { ExchangeRegistry } from './exchange-registry';
import { ExchangeRouter } from './exchange-router';
import type { ExchangeConnection } from './domain/exchange-connection';

const WS = 'ws-us209';
const T0 = '2026-07-20T17:00:00.000Z';

class InMemoryExchangeRepository implements ExchangeAdapterRepository {
  connections = new Map<string, ExchangeConnection>();
  events: Array<{ id: string; event: ExchangeDomainEvent }> = [];

  async createConnection(connection: ExchangeConnection): Promise<ExchangeConnection> {
    this.connections.set(connection.id, connection);
    return connection;
  }

  async saveConnection(connection: ExchangeConnection): Promise<ExchangeConnection> {
    this.connections.set(connection.id, connection);
    return connection;
  }

  async findConnectionById(connectionId: string): Promise<ExchangeConnection | null> {
    return this.connections.get(connectionId) ?? null;
  }

  async findConnectionByWorkspaceAndExchange(
    workspaceId: string,
    exchangeId: string,
  ): Promise<ExchangeConnection | null> {
    return (
      [...this.connections.values()].find(
        (c) => c.workspaceId === workspaceId && c.exchangeId === exchangeId,
      ) ?? null
    );
  }

  async listConnectionsByWorkspaceId(workspaceId: string): Promise<ExchangeConnection[]> {
    return [...this.connections.values()].filter((c) => c.workspaceId === workspaceId);
  }

  async appendEvent(event: ExchangeDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }

  async listEventsByConnectionId(connectionId: string): Promise<ExchangeDomainEvent[]> {
    return this.events.filter((e) => e.event.connectionId === connectionId).map((e) => e.event);
  }
}

describe('US209 Exchange Adapter Layer', () => {
  let repository: InMemoryExchangeRepository;
  let registry: ExchangeRegistry;
  let factory: ExchangeFactory;
  let router: ExchangeRouter;
  let publisher: ExchangeEventPublisher;
  let manager: ExchangeManager;
  let service: ExchangeAdapterService;

  beforeEach(() => {
    repository = new InMemoryExchangeRepository();
    registry = new ExchangeRegistry();
    factory = new ExchangeFactory(registry);
    router = new ExchangeRouter(registry);
    publisher = new ExchangeEventPublisher(repository);
    manager = new ExchangeManager(factory, registry, router, publisher, repository);
    manager.setClock({ now: () => T0 });
    manager.onModuleInit();
    publisher.clearPublishedEvents();
    service = new ExchangeAdapterService(manager);
  });

  describe('capabilities', () => {
    it('declares capabilities per adapter', () => {
      expect(new MockExchangeAdapter().capabilities()).toEqual(
        createExchangeCapabilities({
          supportsSpot: true,
          supportsMargin: false,
          supportsFutures: false,
          supportsWebSocket: true,
          supportsMarketOrders: true,
          supportsLimitOrders: true,
          supportsOCO: false,
          supportsReduceOnly: false,
        }),
      );
      expect(new BinanceExchangeAdapter().capabilities().supportsOCO).toBe(true);
      expect(new BybitExchangeAdapter().capabilities().supportsFutures).toBe(true);
      expect(new OkxExchangeAdapter().capabilities().supportsMargin).toBe(true);
    });
  });

  describe('registry and factory', () => {
    it('registers and discovers adapters', () => {
      expect(registry.listExchangeIds()).toEqual(['MOCK', 'BINANCE', 'BYBIT', 'OKX']);
      expect(registry.getCapabilities('MOCK').supportsSpot).toBe(true);
      expect(() => registry.get('UNKNOWN' as 'MOCK')).toThrow(ExchangeNotFoundError);
    });

    it('factory returns singleton per venue', () => {
      const a = factory.create('MOCK');
      const b = factory.create('MOCK');
      expect(a).toBe(b);
    });
  });

  describe('domain connection', () => {
    it('creates and transitions connection state', () => {
      const connection = createExchangeConnection({
        id: 'conn-1',
        workspaceId: WS,
        exchangeId: 'MOCK',
        capabilities: new MockExchangeAdapter().capabilities(),
        createdAt: T0,
        updatedAt: T0,
      });
      expect(connection.status).toBe('DISCONNECTED');
      const connected = withHeartbeat(withConnectionStatus(connection, 'CONNECTED', T0), T0, 12);
      expect(connected.status).toBe('CONNECTED');
      expect(connected.latencyMs).toBe(12);
      expect(connected.lastHeartbeatAt).toBe(T0);
    });
  });

  describe('order translation', () => {
    it('normalizes internal order requests', () => {
      const order = createExchangeOrderRequest({
        clientOrderId: 'c-1',
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'LIMIT',
        quantity: '1',
        price: '100',
      });
      expect(order.price).toBe('100');
      expect(() =>
        createExchangeOrderRequest({
          clientOrderId: '',
          symbol: 'BTCUSDT',
          side: 'BUY',
          type: 'MARKET',
          quantity: '1',
          price: null,
        }),
      ).toThrow();
    });
  });

  describe('connection management', () => {
    it('connects and disconnects mock exchange', async () => {
      const connected = await service.connect(WS, 'MOCK');
      expect(connected.status).toBe('CONNECTED');
      expect(connected.latencyMs).toBe(1);
      expect(publisher.getPublishedEvents().map((e) => e.eventType)).toContain('ExchangeConnected');

      await expect(service.connect(WS, 'MOCK')).rejects.toBeInstanceOf(
        ExchangeAlreadyConnectedError,
      );

      const disconnected = await service.disconnect(WS, 'MOCK', 'user');
      expect(disconnected.status).toBe('DISCONNECTED');
      expect(publisher.getPublishedEvents().map((e) => e.eventType)).toContain(
        'ExchangeDisconnected',
      );
    });

    it('lists exchanges with status', async () => {
      await service.connect(WS, 'MOCK');
      const list = await service.listExchanges(WS);
      expect(list).toHaveLength(4);
      const mock = list.find((e) => e.exchangeId === 'MOCK');
      expect(mock?.connection?.status).toBe('CONNECTED');

      const status = await service.getStatus(WS);
      expect(status.connectedCount).toBe(1);
      expect(status.totalCount).toBe(4);
    });

    it('reconnects after disconnect', async () => {
      await service.connect(WS, 'MOCK');
      await service.disconnect(WS, 'MOCK');
      const again = await service.connect(WS, 'MOCK');
      expect(again.status).toBe('CONNECTED');
    });

    it('records heartbeat', async () => {
      await service.connect(WS, 'MOCK');
      const hb = await service.heartbeat(WS, 'MOCK');
      expect(hb.lastHeartbeatAt).toBe(T0);
      expect(publisher.getPublishedEvents().some((e) => e.eventType === 'HeartbeatReceived')).toBe(
        true,
      );
    });
  });

  describe('mock order submission and execution sync', () => {
    it('submits market order, publishes events, and syncs executions', async () => {
      await service.connect(WS, 'MOCK');
      publisher.clearPublishedEvents();

      const response = await service.submitOrder(WS, 'MOCK', {
        clientOrderId: 'c-mkt-1',
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'MARKET',
        quantity: '0.1',
        price: null,
      });

      expect(response.accepted).toBe(true);
      expect(response.order?.status).toBe('FILLED');
      expect(response.order?.filledQuantity).toBe('0.1');

      const types = publisher.getPublishedEvents().map((e) => e.eventType);
      expect(types).toContain('OrderAccepted');
      expect(types).toContain('OrderFilled');
      expect(types).toContain('ExecutionReceived');

      const executions = await service.synchronizeExecutions(WS, 'MOCK');
      expect(executions.length).toBeGreaterThanOrEqual(1);
      expect(executions[0]?.symbol).toBe('BTCUSDT');

      const balances = await service.getBalances(WS, 'MOCK');
      expect(balances.some((b) => b.asset === 'BTC' || b.asset === 'USDT')).toBe(true);
    });

    it('submits and cancels limit order', async () => {
      await service.connect(WS, 'MOCK');
      publisher.clearPublishedEvents();

      const response = await service.submitOrder(WS, 'MOCK', {
        clientOrderId: 'c-lmt-1',
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'LIMIT',
        quantity: '1',
        price: '90000',
      });
      expect(response.order?.status).toBe('ACCEPTED');

      const cancelled = await service.cancelOrder(WS, 'MOCK', {
        exchangeOrderId: response.order!.exchangeOrderId,
      });
      expect(cancelled.order?.status).toBe('CANCELLED');
      expect(publisher.getPublishedEvents().map((e) => e.eventType)).toContain('OrderCancelled');
    });

    it('synchronizes async limit fill executions', async () => {
      await service.connect(WS, 'MOCK');
      const response = await service.submitOrder(WS, 'MOCK', {
        clientOrderId: 'c-lmt-2',
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'LIMIT',
        quantity: '1',
        price: '90000',
      });

      const mock = registry.get('MOCK') as MockExchangeAdapter;
      await mock.fillRestingOrder(response.order!.exchangeOrderId, '90000');

      const order = await service.getOrder(WS, 'MOCK', response.order!.exchangeOrderId);
      expect(order?.status).toBe('FILLED');

      publisher.clearPublishedEvents();
      const executions = await service.synchronizeExecutions(WS, 'MOCK');
      expect(executions.some((e) => e.exchangeOrderId === response.order!.exchangeOrderId)).toBe(
        true,
      );
      expect(publisher.getPublishedEvents().map((e) => e.eventType)).toContain('ExecutionReceived');
    });

    it('rejects orders when disconnected', async () => {
      await expect(
        service.submitOrder(WS, 'MOCK', {
          clientOrderId: 'c-1',
          symbol: 'BTCUSDT',
          side: 'BUY',
          type: 'MARKET',
          quantity: '1',
          price: null,
        }),
      ).rejects.toBeInstanceOf(ExchangeNotFoundError);
    });

    it('validates order input', async () => {
      await service.connect(WS, 'MOCK');
      await expect(
        service.submitOrder(WS, 'MOCK', {
          clientOrderId: '',
          symbol: 'BTCUSDT',
          side: 'BUY',
          type: 'MARKET',
          quantity: '1',
          price: null,
        }),
      ).rejects.toBeInstanceOf(ExchangeValidationError);
    });
  });

  describe('router', () => {
    it('routes only to connected adapters', async () => {
      factory.create('MOCK');
      expect(() => router.resolve('MOCK')).toThrow(ExchangeNotConnectedError);
      await service.connect(WS, 'MOCK');
      expect(router.resolve('MOCK').exchangeId).toBe('MOCK');
    });
  });

  describe('REST facade', () => {
    it('returns capabilities for exchange id', async () => {
      const caps = await service.getCapabilities(WS, 'BINANCE');
      expect(caps.supportsOCO).toBe(true);
    });

    it('gets exchange by id', async () => {
      const view = await service.getExchange(WS, 'OKX');
      expect(view.exchangeId).toBe('OKX');
      expect(view.connection).toBeNull();
    });
  });

  describe('mock adapter isolation', () => {
    it('does not allow cancel of filled order', async () => {
      const mock = new MockExchangeAdapter();
      await mock.connect();
      const filled = await mock.submitOrder({
        clientOrderId: 'x',
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'MARKET',
        quantity: '1',
        price: null,
      });
      await expect(
        mock.cancelOrder({ exchangeOrderId: filled.order!.exchangeOrderId }),
      ).rejects.toBeInstanceOf(ExchangeOrderRejectedError);
    });

    it('supports ticker subscription', async () => {
      const mock = new MockExchangeAdapter();
      await mock.connect();
      const ticks: string[] = [];
      const sub = mock.subscribeTicker('BTCUSDT', (t) => ticks.push(t.symbol));
      const ticker = await mock.getMarketPrice('BTCUSDT');
      expect(ticker.last).toBe('100000');
      sub.unsubscribe();
    });
  });
});
