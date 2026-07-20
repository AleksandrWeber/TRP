import { randomUUID } from 'node:crypto';
import { createExchangeCapabilities } from '../domain/exchange-capabilities';
import type { ExchangeId } from '../domain/exchange-id';
import {
  freezeBalance,
  freezeExecution,
  freezePosition,
  freezeTicker,
  type ExchangeBalance,
  type ExchangeExecution,
  type ExchangePosition,
  type ExchangeTicker,
} from '../domain/exchange-market';
import type {
  ExchangeCancelRequest,
  ExchangeOrderRequest,
  ExchangeOrderResponse,
  ExchangeOrderSnapshot,
} from '../domain/exchange-order';
import {
  ExchangeNotConnectedError,
  ExchangeOrderNotFoundError,
  ExchangeOrderRejectedError,
  ExchangeUnsupportedCapabilityError,
  ExchangeValidationError,
} from '../exchange-adapter-errors';
import type {
  ExchangeAdapter,
  ExecutionUpdateHandler,
  ExchangeSubscription,
  OrderUpdateHandler,
  TickerHandler,
} from '../exchange-adapter.port';

const MOCK_CAPABILITIES = createExchangeCapabilities({
  supportsSpot: true,
  supportsMargin: false,
  supportsFutures: false,
  supportsWebSocket: true,
  supportsMarketOrders: true,
  supportsLimitOrders: true,
  supportsOCO: false,
  supportsReduceOnly: false,
});

/**
 * Fully operational in-process mock exchange (US209).
 * Used for integration tests and local connection/order/execution flows.
 */
export class MockExchangeAdapter implements ExchangeAdapter {
  readonly exchangeId: ExchangeId = 'MOCK';

  private connected = false;
  private readonly orders = new Map<string, ExchangeOrderSnapshot>();
  private readonly executions: ExchangeExecution[] = [];
  private readonly balances = new Map<string, ExchangeBalance>();
  private readonly tickers = new Map<string, ExchangeTicker>();
  private readonly orderHandlers = new Set<OrderUpdateHandler>();
  private readonly executionHandlers = new Set<ExecutionUpdateHandler>();
  private readonly tickerHandlers = new Map<string, Set<TickerHandler>>();
  private seq = 0;

  constructor() {
    this.balances.set(
      'USDT',
      freezeBalance({ asset: 'USDT', free: '100000', locked: '0', total: '100000' }),
    );
    this.tickers.set(
      'BTCUSDT',
      freezeTicker({
        symbol: 'BTCUSDT',
        bid: '99990',
        ask: '100010',
        last: '100000',
        timestamp: new Date(0).toISOString(),
      }),
    );
  }

  capabilities() {
    return MOCK_CAPABILITIES;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async ping(): Promise<number> {
    this.ensureConnected();
    return 1;
  }

  async submitOrder(order: ExchangeOrderRequest): Promise<ExchangeOrderResponse> {
    this.ensureConnected();
    this.validateOrder(order);

    const now = new Date().toISOString();
    const exchangeOrderId = `mock-ord-${++this.seq}`;

    if (order.type === 'MARKET') {
      const ticker = await this.getMarketPrice(order.symbol);
      const snapshot = freezeOrder({
        exchangeOrderId,
        clientOrderId: order.clientOrderId,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: order.quantity,
        price: ticker.last,
        filledQuantity: order.quantity,
        status: 'FILLED',
        rawStatus: 'FILLED',
        updatedAt: now,
      });
      this.orders.set(exchangeOrderId, snapshot);
      // Order events are published by ExchangeManager from the command response.
      // Execution push notifies async subscribers (ExecutionReceived).

      const execution = freezeExecution({
        executionId: `mock-exec-${this.seq}`,
        exchangeOrderId,
        clientOrderId: order.clientOrderId,
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: ticker.last,
        fee: '0',
        feeAsset: 'USDT',
        timestamp: now,
      });
      this.executions.push(execution);
      this.emitExecution(execution);
      this.applyFill(order.side, order.symbol, order.quantity, ticker.last);

      return Object.freeze({ accepted: true, order: snapshot, rejectReason: null });
    }

    const snapshot = freezeOrder({
      exchangeOrderId,
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      price: order.price,
      filledQuantity: '0',
      status: 'ACCEPTED',
      rawStatus: 'NEW',
      updatedAt: now,
    });
    this.orders.set(exchangeOrderId, snapshot);
    return Object.freeze({ accepted: true, order: snapshot, rejectReason: null });
  }

  async cancelOrder(request: ExchangeCancelRequest): Promise<ExchangeOrderResponse> {
    this.ensureConnected();
    const order = this.orders.get(request.exchangeOrderId);
    if (!order) {
      throw new ExchangeOrderNotFoundError(`mock order not found: ${request.exchangeOrderId}`);
    }
    if (order.status === 'FILLED' || order.status === 'CANCELLED') {
      throw new ExchangeOrderRejectedError(`cannot cancel order in status ${order.status}`);
    }
    const cancelled = freezeOrder({
      ...order,
      status: 'CANCELLED',
      rawStatus: 'CANCELED',
      updatedAt: new Date().toISOString(),
    });
    this.orders.set(cancelled.exchangeOrderId, cancelled);
    // Async cancel notifications go through subscribers; command path publishes OrderCancelled.
    return Object.freeze({ accepted: true, order: cancelled, rejectReason: null });
  }

  async getOrder(exchangeOrderId: string): Promise<ExchangeOrderSnapshot | null> {
    this.ensureConnected();
    return this.orders.get(exchangeOrderId) ?? null;
  }

  async getPositions(): Promise<readonly ExchangePosition[]> {
    this.ensureConnected();
    const positions: ExchangePosition[] = [];
    for (const [asset, balance] of this.balances) {
      if (asset === 'USDT') continue;
      const qty = Number(balance.total);
      if (!Number.isFinite(qty) || qty === 0) continue;
      positions.push(
        freezePosition({
          symbol: `${asset}USDT`,
          side: qty > 0 ? 'LONG' : 'SHORT',
          quantity: Math.abs(qty).toString(),
          entryPrice: null,
          unrealizedPnl: null,
        }),
      );
    }
    return Object.freeze(positions);
  }

  async getBalances(): Promise<readonly ExchangeBalance[]> {
    this.ensureConnected();
    return Object.freeze([...this.balances.values()]);
  }

  async getMarketPrice(symbol: string): Promise<ExchangeTicker> {
    this.ensureConnected();
    const existing = this.tickers.get(symbol);
    if (existing) {
      return freezeTicker({ ...existing, timestamp: new Date().toISOString() });
    }
    const ticker = freezeTicker({
      symbol,
      bid: '99',
      ask: '101',
      last: '100',
      timestamp: new Date().toISOString(),
    });
    this.tickers.set(symbol, ticker);
    return ticker;
  }

  subscribeTicker(symbol: string, handler: TickerHandler): ExchangeSubscription {
    let set = this.tickerHandlers.get(symbol);
    if (!set) {
      set = new Set();
      this.tickerHandlers.set(symbol, set);
    }
    set.add(handler);
    return Object.freeze({
      unsubscribe: () => {
        set?.delete(handler);
      },
    });
  }

  subscribeOrderUpdates(handler: OrderUpdateHandler): ExchangeSubscription {
    this.orderHandlers.add(handler);
    return Object.freeze({
      unsubscribe: () => {
        this.orderHandlers.delete(handler);
      },
    });
  }

  subscribeExecutionUpdates(handler: ExecutionUpdateHandler): ExchangeSubscription {
    this.executionHandlers.add(handler);
    return Object.freeze({
      unsubscribe: () => {
        this.executionHandlers.delete(handler);
      },
    });
  }

  /** Test helper: force a limit fill and emit execution. */
  async fillRestingOrder(exchangeOrderId: string, fillPrice: string): Promise<ExchangeExecution> {
    this.ensureConnected();
    const order = this.orders.get(exchangeOrderId);
    if (!order) throw new ExchangeOrderNotFoundError();
    if (order.status !== 'ACCEPTED' && order.status !== 'PARTIALLY_FILLED') {
      throw new ExchangeOrderRejectedError(`cannot fill order in status ${order.status}`);
    }
    const now = new Date().toISOString();
    const filled = freezeOrder({
      ...order,
      price: fillPrice,
      filledQuantity: order.quantity,
      status: 'FILLED',
      rawStatus: 'FILLED',
      updatedAt: now,
    });
    this.orders.set(filled.exchangeOrderId, filled);
    this.emitOrder(filled);
    const execution = freezeExecution({
      executionId: `mock-exec-${++this.seq}`,
      exchangeOrderId: filled.exchangeOrderId,
      clientOrderId: filled.clientOrderId,
      symbol: filled.symbol,
      side: filled.side,
      quantity: filled.quantity,
      price: fillPrice,
      fee: '0',
      feeAsset: 'USDT',
      timestamp: now,
    });
    this.executions.push(execution);
    this.emitExecution(execution);
    this.applyFill(filled.side, filled.symbol, filled.quantity, fillPrice);
    return execution;
  }

  listExecutions(): readonly ExchangeExecution[] {
    return Object.freeze([...this.executions]);
  }

  private validateOrder(order: ExchangeOrderRequest): void {
    if (!order.clientOrderId?.trim()) {
      throw new ExchangeValidationError('clientOrderId is required');
    }
    if (!order.symbol?.trim()) {
      throw new ExchangeValidationError('symbol is required');
    }
    if (!order.quantity?.trim() || Number(order.quantity) <= 0) {
      throw new ExchangeValidationError('quantity must be positive');
    }
    if (order.type === 'LIMIT' && (order.price === null || Number(order.price) <= 0)) {
      throw new ExchangeValidationError('limit orders require a positive price');
    }
    if (order.type === 'MARKET' && !MOCK_CAPABILITIES.supportsMarketOrders) {
      throw new ExchangeUnsupportedCapabilityError('market orders not supported');
    }
    if (order.type === 'LIMIT' && !MOCK_CAPABILITIES.supportsLimitOrders) {
      throw new ExchangeUnsupportedCapabilityError('limit orders not supported');
    }
    if (order.reduceOnly && !MOCK_CAPABILITIES.supportsReduceOnly) {
      throw new ExchangeUnsupportedCapabilityError('reduceOnly not supported');
    }
  }

  private applyFill(side: 'BUY' | 'SELL', symbol: string, quantity: string, price: string): void {
    const base = symbol.replace(/USDT$/i, '') || symbol;
    const qty = Number(quantity);
    const px = Number(price);
    const notional = qty * px;
    const usdt =
      this.balances.get('USDT') ??
      freezeBalance({
        asset: 'USDT',
        free: '0',
        locked: '0',
        total: '0',
      });
    const baseBal =
      this.balances.get(base) ??
      freezeBalance({
        asset: base,
        free: '0',
        locked: '0',
        total: '0',
      });

    if (side === 'BUY') {
      this.balances.set(
        'USDT',
        freezeBalance({
          asset: 'USDT',
          free: String(Number(usdt.free) - notional),
          locked: usdt.locked,
          total: String(Number(usdt.total) - notional),
        }),
      );
      this.balances.set(
        base,
        freezeBalance({
          asset: base,
          free: String(Number(baseBal.free) + qty),
          locked: baseBal.locked,
          total: String(Number(baseBal.total) + qty),
        }),
      );
    } else {
      this.balances.set(
        base,
        freezeBalance({
          asset: base,
          free: String(Number(baseBal.free) - qty),
          locked: baseBal.locked,
          total: String(Number(baseBal.total) - qty),
        }),
      );
      this.balances.set(
        'USDT',
        freezeBalance({
          asset: 'USDT',
          free: String(Number(usdt.free) + notional),
          locked: usdt.locked,
          total: String(Number(usdt.total) + notional),
        }),
      );
    }
  }

  private emitOrder(order: ExchangeOrderSnapshot): void {
    for (const handler of this.orderHandlers) handler(order);
  }

  private emitExecution(execution: ExchangeExecution): void {
    for (const handler of this.executionHandlers) handler(execution);
  }

  private ensureConnected(): void {
    if (!this.connected) throw new ExchangeNotConnectedError('Mock exchange is not connected');
  }
}

function freezeOrder(order: ExchangeOrderSnapshot): ExchangeOrderSnapshot {
  return Object.freeze({ ...order });
}

/** Stable id helper for tests that need deterministic client order ids. */
export function mockClientOrderId(): string {
  return `client-${randomUUID()}`;
}
