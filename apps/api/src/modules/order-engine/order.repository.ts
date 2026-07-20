import type { Order } from './domain/order';
import type { OrderFill } from './domain/order-fill';
import type { OrderHistory } from './domain/order-history';
import type { OrderDomainEvent } from './order-events';

export const ORDER_REPOSITORY = Symbol('ORDER_ENGINE_REPOSITORY');

export interface OrderRepository {
  create(order: Order): Promise<Order>;

  save(order: Order): Promise<Order>;

  findById(orderId: string): Promise<Order | null>;

  listByPortfolioId(portfolioId: string): Promise<Order[]>;

  listOpenByPortfolioId(portfolioId: string): Promise<Order[]>;

  createFill(fill: OrderFill): Promise<OrderFill>;

  listFillsByOrderId(orderId: string): Promise<OrderFill[]>;

  createHistory(entry: OrderHistory): Promise<OrderHistory>;

  listHistoryByOrderId(orderId: string): Promise<OrderHistory[]>;

  listHistoryByPortfolioId(portfolioId: string): Promise<OrderHistory[]>;

  appendEvent(event: OrderDomainEvent, eventId: string): Promise<void>;

  listEvents(orderId: string): Promise<OrderDomainEvent[]>;
}
