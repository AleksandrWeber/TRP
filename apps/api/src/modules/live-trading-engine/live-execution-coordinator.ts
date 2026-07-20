import { Inject, Injectable } from '@nestjs/common';
import {
  ExchangeAdapterService,
  createExchangeOrderRequest,
  type ExchangeOrderResponse,
} from '../exchange-adapter';
import { OrderService, type CreateOrderRequest, type OrderView } from '../order-engine';
import type { LiveSession } from './domain/live-session';
import { HealthMonitor } from './health-monitor';
import { LiveEventPublisher } from './live-event-publisher';
import { LiveSessionManager } from './live-session-manager';
import { RecoveryManager } from './recovery-manager';
import {
  LiveExecutionFailedError,
  LiveOrderRejectedError,
  LiveSessionInvalidStateError,
  LiveSessionValidationError,
} from './live-trading-errors';

export type LiveOrderRequest = Readonly<{
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  requestedPrice?: string | null;
  timeInForce?: string;
}>;

export type LiveOrderResult = Readonly<{
  session: LiveSession;
  order: OrderView;
  exchangeOrderId: string | null;
  exchangeResponse: ExchangeOrderResponse | null;
}>;

/**
 * LiveExecutionCoordinator — Order Lifecycle → Risk → Exchange Adapter → fills (US210).
 * Never bypasses Risk Engine; never mutates Portfolio/Position directly.
 */
@Injectable()
export class LiveExecutionCoordinator {
  constructor(
    @Inject(LiveSessionManager) private readonly sessions: LiveSessionManager,
    @Inject(LiveEventPublisher) private readonly events: LiveEventPublisher,
    @Inject(OrderService) private readonly orders: OrderService,
    @Inject(ExchangeAdapterService) private readonly exchanges: ExchangeAdapterService,
    @Inject(RecoveryManager) private readonly recovery: RecoveryManager,
    @Inject(HealthMonitor) private readonly health: HealthMonitor,
  ) {}

  async submitOrder(
    workspaceId: string,
    ownerId: string,
    sessionId: string,
    request: LiveOrderRequest,
  ): Promise<LiveOrderResult> {
    const session = await this.sessions.requireSession(workspaceId, sessionId);
    if (session.status !== 'RUNNING') {
      throw new LiveSessionInvalidStateError(
        `orders require RUNNING session (current: ${session.status})`,
      );
    }
    if (session.tradingFrozen) {
      throw new LiveSessionInvalidStateError(
        'trading is frozen by kill switch — clear kill switch before submitting orders',
      );
    }
    if (session.ownerId !== ownerId) {
      throw new LiveSessionInvalidStateError('session owner mismatch');
    }

    const createRequest = this.toCreateOrderRequest(request);
    const order = await this.orders.create(session.portfolioWorkspaceKey, ownerId, createRequest);

    if (order.status === 'REJECTED') {
      throw new LiveOrderRejectedError(`order rejected by risk engine: ${order.id}`);
    }

    if (order.status !== 'PENDING' && order.status !== 'PARTIALLY_FILLED') {
      throw new LiveExecutionFailedError(`order not submittable in status ${order.status}`);
    }

    const clientOrderId = `live-${order.id}`;
    const exchangeType = normalizeExchangeType(order.type);
    const exchangeSide = normalizeExchangeSide(order.side);

    let exchangeResponse: ExchangeOrderResponse;
    const ackStarted = Date.now();
    try {
      exchangeResponse = await this.exchanges.submitOrder(workspaceId, session.exchange, {
        clientOrderId,
        symbol: order.symbol,
        side: exchangeSide,
        type: exchangeType,
        quantity: order.quantity,
        price: order.requestedPrice,
      });
    } catch (error) {
      throw new LiveExecutionFailedError(
        error instanceof Error ? error.message : 'Exchange order submission failed',
        error,
      );
    }
    this.health.recordOrderAcknowledgementDelay(session.id, Date.now() - ackStarted);

    if (!exchangeResponse.accepted || !exchangeResponse.order) {
      throw new LiveOrderRejectedError(
        exchangeResponse.rejectReason ?? `exchange rejected order ${order.id}`,
      );
    }

    await this.events.publish({
      eventType: 'LiveOrderSubmitted',
      sessionId: session.id,
      occurredAt: new Date().toISOString(),
      orderId: order.id,
      exchangeOrderId: exchangeResponse.order.exchangeOrderId,
      symbol: order.symbol,
    });

    let filled: OrderView = order;
    if (
      exchangeResponse.order.status === 'FILLED' ||
      exchangeResponse.order.status === 'PARTIALLY_FILLED'
    ) {
      const fillPrice =
        exchangeResponse.order.price ??
        order.requestedPrice ??
        (await this.resolveMarketPrice(workspaceId, session.exchange, order.symbol));
      const fillQty =
        exchangeResponse.order.filledQuantity !== '0'
          ? exchangeResponse.order.filledQuantity
          : order.quantity;

      const executionId = `exch-${exchangeResponse.order.exchangeOrderId}-${fillQty}`;
      const applied = await this.recovery.applyExecution(workspaceId, ownerId, session, order.id, {
        executionId,
        exchangeOrderId: exchangeResponse.order.exchangeOrderId,
        clientOrderId,
        symbol: order.symbol,
        side: exchangeSide,
        quantity: fillQty,
        price: fillPrice,
        fee: '0',
        feeAsset: 'USDT',
        timestamp: exchangeResponse.order.updatedAt,
      });

      if (applied) {
        filled = await this.orders.getById(session.portfolioWorkspaceKey, ownerId, order.id);
      }
    }

    // Validate request shape via createExchangeOrderRequest for contract safety.
    try {
      createExchangeOrderRequest({
        clientOrderId,
        symbol: order.symbol,
        side: exchangeSide,
        type: exchangeType,
        quantity: order.quantity,
        price: order.requestedPrice,
      });
    } catch (error) {
      throw new LiveSessionValidationError(
        error instanceof Error ? error.message : 'Invalid exchange order',
        error,
      );
    }

    return Object.freeze({
      session,
      order: filled,
      exchangeOrderId: exchangeResponse.order.exchangeOrderId,
      exchangeResponse,
    });
  }

  private toCreateOrderRequest(request: LiveOrderRequest): CreateOrderRequest {
    return {
      symbol: String(request.symbol ?? ''),
      side: String(request.side ?? ''),
      type: String(request.type ?? ''),
      quantity: String(request.quantity ?? ''),
      requestedPrice:
        request.requestedPrice === undefined || request.requestedPrice === null
          ? request.requestedPrice
          : String(request.requestedPrice),
      timeInForce: request.timeInForce !== undefined ? String(request.timeInForce) : undefined,
    };
  }

  private async resolveMarketPrice(
    workspaceId: string,
    exchange: string,
    symbol: string,
  ): Promise<string> {
    const ticker = await this.exchanges.getMarketPrice(workspaceId, exchange, symbol);
    return ticker.last;
  }
}

function normalizeExchangeSide(side: string): 'BUY' | 'SELL' {
  const normalized = side.trim().toUpperCase();
  if (normalized === 'BUY' || normalized === 'SELL') return normalized;
  throw new LiveSessionValidationError(`unsupported order side: ${side}`);
}

function normalizeExchangeType(type: string): 'MARKET' | 'LIMIT' {
  const normalized = type.trim().toUpperCase();
  if (normalized === 'MARKET' || normalized === 'LIMIT') return normalized;
  throw new LiveSessionValidationError(`unsupported order type for exchange: ${type}`);
}
