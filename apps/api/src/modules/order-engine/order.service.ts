import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PortfolioService } from '../portfolio-engine';
import { RiskService } from '../risk-engine';
import { createOrder, withOrderPatch, type Order } from './domain/order';
import type { OrderFill } from './domain/order-fill';
import type { OrderHistory } from './domain/order-history';
import { isImmutableOrderStatus } from './domain/order-status';
import { OrderEventPublisher } from './order-event-publisher';
import {
  OrderImmutableError,
  OrderInvalidStateError,
  OrderNotFoundError,
  OrderValidationError,
} from './order-errors';
import { OrderExecutionService, type ExecuteFillRequest } from './order-execution.service';
import { OrderFillService } from './order-fill.service';
import { OrderHistoryService } from './order-history.service';
import { OrderLifecycleManager } from './order-lifecycle-manager';
import { OrderValidator } from './order-validator';
import { ORDER_REPOSITORY, type OrderRepository } from './order.repository';

export type OrderView = Readonly<{
  id: string;
  portfolioId: string;
  positionId: string | null;
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  requestedPrice: string | null;
  executedPrice: string | null;
  filledQuantity: string;
  remainingQuantity: string;
  status: string;
  timeInForce: string;
  createdAt: string;
  updatedAt: string;
  executedAt: string | null;
  cancelledAt: string | null;
}>;

export type OrderClock = Readonly<{
  now: () => Date;
  iso: () => string;
}>;

export type CreateOrderRequest = Readonly<{
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  requestedPrice?: string | null;
  timeInForce?: string;
}>;

export type UpdateOrderRequest = Readonly<{
  quantity?: string;
  requestedPrice?: string | null;
  timeInForce?: string;
}>;

/**
 * Order Lifecycle Engine application service (US206).
 * Single source of truth for trading order lifecycle.
 * Integrates with Position, Portfolio, and Risk via public service APIs only.
 */
@Injectable()
export class OrderService {
  private clock: OrderClock = defaultClock();
  private readonly validator = new OrderValidator();
  private readonly lifecycle = new OrderLifecycleManager(this.validator);

  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repository: OrderRepository,
    @Inject(OrderHistoryService) private readonly history: OrderHistoryService,
    @Inject(OrderEventPublisher) private readonly events: OrderEventPublisher,
    @Inject(OrderFillService) private readonly fills: OrderFillService,
    @Inject(OrderExecutionService) private readonly execution: OrderExecutionService,
    @Inject(PortfolioService) private readonly portfolios: PortfolioService,
    @Inject(RiskService) private readonly risk: RiskService,
  ) {}

  /** Test hook for deterministic timestamps. */
  setClock(clock: OrderClock): void {
    this.clock = clock;
  }

  async list(workspaceId: string, ownerId: string): Promise<OrderView[]> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const orders = await this.repository.listByPortfolioId(portfolioId);
    return orders.map((o) => this.toView(o));
  }

  async listOpen(workspaceId: string, ownerId: string): Promise<OrderView[]> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const orders = await this.repository.listOpenByPortfolioId(portfolioId);
    return orders.map((o) => this.toView(o));
  }

  async getById(workspaceId: string, ownerId: string, orderId: string): Promise<OrderView> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const order = await this.requireOrder(orderId, portfolioId);
    return this.toView(order);
  }

  async listHistory(
    workspaceId: string,
    ownerId: string,
    orderId?: string,
  ): Promise<OrderHistory[]> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    if (orderId) {
      await this.requireOrder(orderId, portfolioId);
      return this.history.listByOrderId(orderId);
    }
    return this.history.listByPortfolioId(portfolioId);
  }

  async listFills(workspaceId: string, ownerId: string, orderId: string): Promise<OrderFill[]> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    await this.requireOrder(orderId, portfolioId);
    return this.fills.listByOrderId(orderId);
  }

  async create(
    workspaceId: string,
    ownerId: string,
    request: CreateOrderRequest,
  ): Promise<OrderView> {
    this.validator.validateCreateRequest(request);
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const now = this.clock.iso();

    let order: Order;
    try {
      order = createOrder({
        id: randomUUID(),
        portfolioId,
        symbol: request.symbol,
        side: request.side,
        type: request.type,
        quantity: request.quantity,
        requestedPrice: request.requestedPrice,
        timeInForce: request.timeInForce,
        createdAt: now,
        updatedAt: now,
      });
      this.validator.validateOrderInvariants(order);
    } catch (error) {
      throw this.wrapValidation(error, 'Invalid order create');
    }

    const created = await this.repository.create(order);
    await this.events.publish({
      eventType: 'OrderCreated',
      orderId: created.id,
      occurredAt: now,
      portfolioId: created.portfolioId,
      symbol: created.symbol,
      side: created.side,
      type: created.type,
      quantity: created.quantity,
    });

    // Auto-validate and submit to PENDING (resting order ready for simulated execution).
    const validated = this.lifecycle.validate(created, now);
    const afterValidate = await this.repository.save(validated.order);
    await this.history.record({
      orderId: afterValidate.id,
      timestamp: now,
      previousStatus: validated.previousStatus,
      currentStatus: validated.currentStatus,
      reason: validated.reason,
    });
    await this.events.publish({
      eventType: 'OrderValidated',
      orderId: afterValidate.id,
      occurredAt: now,
      status: afterValidate.status,
    });

    // Risk Engine gate (US207) — mandatory before submit/execution.
    const openOrders = await this.repository.listOpenByPortfolioId(portfolioId);
    const activeOrders = openOrders
      .filter((o) => o.id !== afterValidate.id)
      .map((o) =>
        Object.freeze({
          id: o.id,
          symbol: o.symbol,
          side: o.side,
          type: o.type,
          quantity: o.quantity,
          requestedPrice: o.requestedPrice,
          status: o.status,
        }),
      );

    const riskEvaluation = await this.risk.evaluate(workspaceId, ownerId, {
      orderId: afterValidate.id,
      symbol: afterValidate.symbol,
      side: afterValidate.side,
      type: afterValidate.type,
      quantity: afterValidate.quantity,
      requestedPrice: afterValidate.requestedPrice,
      activeOrders,
    });

    if (riskEvaluation.decision.decision === 'REJECTED') {
      const rejected = this.lifecycle.reject(afterValidate, now, riskEvaluation.decision.reason);
      const afterReject = await this.repository.save(rejected.order);
      await this.history.record({
        orderId: afterReject.id,
        timestamp: now,
        previousStatus: rejected.previousStatus,
        currentStatus: rejected.currentStatus,
        reason: rejected.reason,
      });
      await this.events.publish({
        eventType: 'OrderRejected',
        orderId: afterReject.id,
        occurredAt: now,
        reason: rejected.reason,
      });
      await this.events.publish({
        eventType: 'OrderUpdated',
        orderId: afterReject.id,
        occurredAt: now,
        status: afterReject.status,
        filledQuantity: afterReject.filledQuantity,
        remainingQuantity: afterReject.remainingQuantity,
      });
      return this.toView(afterReject);
    }

    const submitted = this.lifecycle.submit(afterValidate, now);
    const afterSubmit = await this.repository.save(submitted.order);
    await this.history.record({
      orderId: afterSubmit.id,
      timestamp: now,
      previousStatus: submitted.previousStatus,
      currentStatus: submitted.currentStatus,
      reason: submitted.reason,
    });
    await this.events.publish({
      eventType: 'OrderSubmitted',
      orderId: afterSubmit.id,
      occurredAt: now,
      status: afterSubmit.status,
    });
    await this.events.publish({
      eventType: 'OrderUpdated',
      orderId: afterSubmit.id,
      occurredAt: now,
      status: afterSubmit.status,
      filledQuantity: afterSubmit.filledQuantity,
      remainingQuantity: afterSubmit.remainingQuantity,
    });

    return this.toView(afterSubmit);
  }

  async cancel(
    workspaceId: string,
    ownerId: string,
    orderId: string,
    reason = 'order cancelled',
  ): Promise<OrderView> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const existing = await this.requireOrder(orderId, portfolioId);
    if (isImmutableOrderStatus(existing.status)) {
      throw new OrderImmutableError(`cannot cancel order in status ${existing.status}`);
    }
    const now = this.clock.iso();
    const result = this.lifecycle.cancel(existing, now, reason);
    const saved = await this.repository.save(result.order);
    await this.history.record({
      orderId: saved.id,
      timestamp: now,
      previousStatus: result.previousStatus,
      currentStatus: result.currentStatus,
      reason: result.reason,
    });
    await this.events.publish({
      eventType: 'OrderCancelled',
      orderId: saved.id,
      occurredAt: now,
      reason: result.reason,
    });
    await this.events.publish({
      eventType: 'OrderUpdated',
      orderId: saved.id,
      occurredAt: now,
      status: saved.status,
      filledQuantity: saved.filledQuantity,
      remainingQuantity: saved.remainingQuantity,
    });
    return this.toView(saved);
  }

  async expire(
    workspaceId: string,
    ownerId: string,
    orderId: string,
    reason = 'order expired',
  ): Promise<OrderView> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const existing = await this.requireOrder(orderId, portfolioId);
    const now = this.clock.iso();
    const result = this.lifecycle.expire(existing, now, reason);
    const saved = await this.repository.save(result.order);
    await this.history.record({
      orderId: saved.id,
      timestamp: now,
      previousStatus: result.previousStatus,
      currentStatus: result.currentStatus,
      reason: result.reason,
    });
    await this.events.publish({
      eventType: 'OrderExpired',
      orderId: saved.id,
      occurredAt: now,
      reason: result.reason,
    });
    await this.events.publish({
      eventType: 'OrderUpdated',
      orderId: saved.id,
      occurredAt: now,
      status: saved.status,
      filledQuantity: saved.filledQuantity,
      remainingQuantity: saved.remainingQuantity,
    });
    return this.toView(saved);
  }

  async execute(
    workspaceId: string,
    ownerId: string,
    orderId: string,
    request: ExecuteFillRequest,
  ): Promise<OrderView> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const existing = await this.requireOrder(orderId, portfolioId);
    if (existing.status === 'CANCELLED') {
      throw new OrderInvalidStateError('cancelled orders cannot be executed');
    }
    if (existing.status === 'FILLED') {
      throw new OrderImmutableError();
    }
    if (existing.status !== 'PENDING' && existing.status !== 'PARTIALLY_FILLED') {
      throw new OrderInvalidStateError(`order cannot be executed in status ${existing.status}`);
    }
    const now = this.clock.iso();
    const result = await this.execution.execute(workspaceId, ownerId, existing, request, now);
    return this.toView(result.order);
  }

  async update(
    workspaceId: string,
    ownerId: string,
    orderId: string,
    request: UpdateOrderRequest,
  ): Promise<OrderView> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const existing = await this.requireOrder(orderId, portfolioId);
    if (isImmutableOrderStatus(existing.status)) {
      throw new OrderImmutableError();
    }
    if (existing.status === 'PARTIALLY_FILLED' && request.quantity !== undefined) {
      // Allow quantity increase only while partially filled; validated in withOrderPatch.
    }
    const now = this.clock.iso();
    let next: Order;
    try {
      next = withOrderPatch(existing, {
        quantity: request.quantity,
        requestedPrice: request.requestedPrice,
        timeInForce: request.timeInForce,
        updatedAt: now,
      });
      this.validator.validateOrderInvariants(next);
    } catch (error) {
      throw this.wrapValidation(error, 'Invalid order update');
    }

    const saved = await this.repository.save(next);
    await this.events.publish({
      eventType: 'OrderUpdated',
      orderId: saved.id,
      occurredAt: now,
      status: saved.status,
      filledQuantity: saved.filledQuantity,
      remainingQuantity: saved.remainingQuantity,
    });
    return this.toView(saved);
  }

  private async requirePortfolioId(workspaceId: string, ownerId: string): Promise<string> {
    const portfolio = await this.portfolios.getOrCreate(workspaceId, ownerId);
    return portfolio.id;
  }

  private async requireOrder(orderId: string, portfolioId: string): Promise<Order> {
    const order = await this.repository.findById(orderId);
    if (!order || order.portfolioId !== portfolioId) {
      throw new OrderNotFoundError();
    }
    return order;
  }

  private wrapValidation(error: unknown, fallback: string): Error {
    if (error instanceof OrderInvalidStateError) return error;
    if (error instanceof OrderImmutableError) return error;
    if (error instanceof OrderValidationError) return error;
    if (error instanceof Error && error.message.includes('immutable')) {
      return new OrderImmutableError(error.message);
    }
    return new OrderValidationError(error instanceof Error ? error.message : fallback, error);
  }

  private toView(order: Order): OrderView {
    this.validator.validateOrderInvariants(order);
    return Object.freeze({
      id: order.id,
      portfolioId: order.portfolioId,
      positionId: order.positionId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      requestedPrice: order.requestedPrice,
      executedPrice: order.executedPrice,
      filledQuantity: order.filledQuantity,
      remainingQuantity: order.remainingQuantity,
      status: order.status,
      timeInForce: order.timeInForce,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      executedAt: order.executedAt,
      cancelledAt: order.cancelledAt,
    });
  }
}

function defaultClock(): OrderClock {
  return {
    now: () => new Date(),
    iso: () => new Date().toISOString(),
  };
}
