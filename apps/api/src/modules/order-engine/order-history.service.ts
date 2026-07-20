import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createOrderHistory, type OrderHistory } from './domain/order-history';
import type { OrderStatus } from './domain/order-status';
import { OrderEventPublisher } from './order-event-publisher';
import { ORDER_REPOSITORY, type OrderRepository } from './order.repository';

export type RecordOrderHistoryInput = Readonly<{
  orderId: string;
  timestamp: string;
  previousStatus: OrderStatus;
  currentStatus: OrderStatus;
  reason: string;
}>;

/**
 * Appends immutable order history entries (US206).
 */
@Injectable()
export class OrderHistoryService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repository: OrderRepository,
    @Inject(OrderEventPublisher) private readonly events: OrderEventPublisher,
  ) {}

  async record(input: RecordOrderHistoryInput): Promise<OrderHistory> {
    const entry = createOrderHistory({
      id: randomUUID(),
      orderId: input.orderId,
      timestamp: input.timestamp,
      previousStatus: input.previousStatus,
      currentStatus: input.currentStatus,
      reason: input.reason,
    });
    const saved = await this.repository.createHistory(entry);
    await this.events.publish({
      eventType: 'OrderHistoryCreated',
      orderId: saved.orderId,
      occurredAt: saved.timestamp,
      previousStatus: saved.previousStatus,
      currentStatus: saved.currentStatus,
      reason: saved.reason,
    });
    return saved;
  }

  async listByOrderId(orderId: string): Promise<OrderHistory[]> {
    return this.repository.listHistoryByOrderId(orderId);
  }

  async listByPortfolioId(portfolioId: string): Promise<OrderHistory[]> {
    return this.repository.listHistoryByPortfolioId(portfolioId);
  }
}
