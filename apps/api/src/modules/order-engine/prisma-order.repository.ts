import { Injectable } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';
import { rehydrateOrder, type Order } from './domain/order';
import { createOrderFill, type OrderFill } from './domain/order-fill';
import { createOrderHistory, type OrderHistory } from './domain/order-history';
import type { OrderDomainEvent, OrderEventType } from './order-events';
import type { OrderRepository } from './order.repository';

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(order: Order): Promise<Order> {
    const row = await this.prisma.order.create({
      data: toRow(order),
    });
    return fromRow(row);
  }

  async save(order: Order): Promise<Order> {
    const row = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        positionId: order.positionId,
        quantity: order.quantity,
        requestedPrice: order.requestedPrice,
        executedPrice: order.executedPrice,
        filledQuantity: order.filledQuantity,
        remainingQuantity: order.remainingQuantity,
        status: order.status,
        timeInForce: order.timeInForce,
        updatedAt: new Date(order.updatedAt),
        executedAt: order.executedAt ? new Date(order.executedAt) : null,
        cancelledAt: order.cancelledAt ? new Date(order.cancelledAt) : null,
      },
    });
    return fromRow(row);
  }

  async findById(orderId: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    return row ? fromRow(row) : null;
  }

  async listByPortfolioId(portfolioId: string): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: { portfolioId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(fromRow);
  }

  async listOpenByPortfolioId(portfolioId: string): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: {
        portfolioId,
        status: { in: ['CREATED', 'VALIDATED', 'PENDING', 'PARTIALLY_FILLED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(fromRow);
  }

  async createFill(fill: OrderFill): Promise<OrderFill> {
    const row = await this.prisma.orderFill.create({
      data: {
        id: fill.id,
        orderId: fill.orderId,
        timestamp: new Date(fill.timestamp),
        quantity: fill.quantity,
        price: fill.price,
        fee: fill.fee,
      },
    });
    return fromFillRow(row);
  }

  async listFillsByOrderId(orderId: string): Promise<OrderFill[]> {
    const rows = await this.prisma.orderFill.findMany({
      where: { orderId },
      orderBy: { timestamp: 'asc' },
    });
    return rows.map(fromFillRow);
  }

  async createHistory(entry: OrderHistory): Promise<OrderHistory> {
    const row = await this.prisma.orderHistory.create({
      data: {
        id: entry.id,
        orderId: entry.orderId,
        timestamp: new Date(entry.timestamp),
        previousStatus: entry.previousStatus,
        currentStatus: entry.currentStatus,
        reason: entry.reason,
      },
    });
    return fromHistoryRow(row);
  }

  async listHistoryByOrderId(orderId: string): Promise<OrderHistory[]> {
    const rows = await this.prisma.orderHistory.findMany({
      where: { orderId },
      orderBy: { timestamp: 'asc' },
    });
    return rows.map(fromHistoryRow);
  }

  async listHistoryByPortfolioId(portfolioId: string): Promise<OrderHistory[]> {
    const rows = await this.prisma.orderHistory.findMany({
      where: { order: { portfolioId } },
      orderBy: { timestamp: 'asc' },
    });
    return rows.map(fromHistoryRow);
  }

  async appendEvent(event: OrderDomainEvent, eventId: string): Promise<void> {
    const { eventType, orderId, occurredAt, ...rest } = event;
    await this.prisma.orderEvent.create({
      data: {
        id: eventId,
        orderId,
        eventType,
        payload: rest as Prisma.InputJsonValue,
        occurredAt: new Date(occurredAt),
      },
    });
  }

  async listEvents(orderId: string): Promise<OrderDomainEvent[]> {
    const rows = await this.prisma.orderEvent.findMany({
      where: { orderId },
      orderBy: { occurredAt: 'asc' },
    });
    return rows.map((row) => {
      const payload = row.payload as Record<string, unknown>;
      return {
        eventType: row.eventType as OrderEventType,
        orderId: row.orderId,
        occurredAt: row.occurredAt.toISOString(),
        ...payload,
      } as OrderDomainEvent;
    });
  }
}

type OrderRow = {
  id: string;
  portfolioId: string;
  positionId: string | null;
  symbol: string;
  side: string;
  type: string;
  quantity: { toFixed(): string };
  requestedPrice: { toFixed(): string } | null;
  executedPrice: { toFixed(): string } | null;
  filledQuantity: { toFixed(): string };
  remainingQuantity: { toFixed(): string };
  status: string;
  timeInForce: string;
  createdAt: Date;
  updatedAt: Date;
  executedAt: Date | null;
  cancelledAt: Date | null;
};

type FillRow = {
  id: string;
  orderId: string;
  timestamp: Date;
  quantity: { toFixed(): string };
  price: { toFixed(): string };
  fee: { toFixed(): string };
};

type HistoryRow = {
  id: string;
  orderId: string;
  timestamp: Date;
  previousStatus: string;
  currentStatus: string;
  reason: string;
};

function toRow(order: Order) {
  return {
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
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    executedAt: order.executedAt ? new Date(order.executedAt) : null,
    cancelledAt: order.cancelledAt ? new Date(order.cancelledAt) : null,
  };
}

function fromRow(row: OrderRow): Order {
  return rehydrateOrder({
    id: row.id,
    portfolioId: row.portfolioId,
    positionId: row.positionId,
    symbol: row.symbol,
    side: row.side,
    type: row.type,
    quantity: row.quantity.toFixed(),
    requestedPrice: row.requestedPrice ? row.requestedPrice.toFixed() : null,
    executedPrice: row.executedPrice ? row.executedPrice.toFixed() : null,
    filledQuantity: row.filledQuantity.toFixed(),
    remainingQuantity: row.remainingQuantity.toFixed(),
    status: row.status,
    timeInForce: row.timeInForce,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    executedAt: row.executedAt ? row.executedAt.toISOString() : null,
    cancelledAt: row.cancelledAt ? row.cancelledAt.toISOString() : null,
  });
}

function fromFillRow(row: FillRow): OrderFill {
  return createOrderFill({
    id: row.id,
    orderId: row.orderId,
    timestamp: row.timestamp.toISOString(),
    quantity: row.quantity.toFixed(),
    price: row.price.toFixed(),
    fee: row.fee.toFixed(),
  });
}

function fromHistoryRow(row: HistoryRow): OrderHistory {
  return createOrderHistory({
    id: row.id,
    orderId: row.orderId,
    timestamp: row.timestamp.toISOString(),
    previousStatus: row.previousStatus,
    currentStatus: row.currentStatus,
    reason: row.reason,
  });
}
