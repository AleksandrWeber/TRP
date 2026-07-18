import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import type { Order, OrderLifecycleEntry } from '../domain/order';
import { createOrderIntent, OrderSide, OrderType, type OrderIntent } from '../domain/order-intent';
import { isOrderStatus, type OrderStatus } from '../domain/order-status';
import type { OrderRepository } from './order.repository';

type PaperOrderWithLifecycle = Prisma.PaperOrderGetPayload<{
  include: { lifecycle: true };
}>;

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(order: Order, transaction: TransactionContext): Promise<Order> {
    const client = prismaClientForTransaction(transaction);
    await client.paperOrder.create({ data: toCreateData(order) });
    await client.orderLifecycleEntry.createMany({
      data: order.lifecycle.map((entry) => toLifecycleData(order, entry)),
    });
    return order;
  }

  async save(
    order: Order,
    expectedVersion: number,
    transaction: TransactionContext,
  ): Promise<Order> {
    if (order.version !== expectedVersion + 1) {
      throw new Error('order aggregate version must advance exactly once');
    }
    const client = prismaClientForTransaction(transaction);
    const updated = await client.paperOrder.updateMany({
      where: {
        id: order.id,
        workspaceId: order.workspaceId,
        version: expectedVersion,
      },
      data: toUpdateData(order),
    });
    if (updated.count !== 1) {
      throw new Error('order optimistic version conflict');
    }
    const latest = order.lifecycle.at(-1);
    if (!latest) throw new Error('order lifecycle entry is required');
    await client.orderLifecycleEntry.create({
      data: toLifecycleData(order, latest),
    });
    return order;
  }

  async findById(workspaceId: string, orderId: string): Promise<Order | null> {
    const row = await this.prisma.paperOrder.findFirst({
      where: { id: orderId, workspaceId },
      include: { lifecycle: { orderBy: { sequence: 'asc' } } },
    });
    return row ? toDomain(row) : null;
  }

  async findByIdempotencyKey(workspaceId: string, idempotencyKey: string): Promise<Order | null> {
    const row = await this.prisma.paperOrder.findUnique({
      where: { workspaceId_idempotencyKey: { workspaceId, idempotencyKey } },
      include: { lifecycle: { orderBy: { sequence: 'asc' } } },
    });
    return row ? toDomain(row) : null;
  }

  async findByClientOrderId(workspaceId: string, clientOrderId: string): Promise<Order | null> {
    const row = await this.prisma.paperOrder.findUnique({
      where: { workspaceId_clientOrderId: { workspaceId, clientOrderId } },
      include: { lifecycle: { orderBy: { sequence: 'asc' } } },
    });
    return row ? toDomain(row) : null;
  }

  async listByWorkspace(workspaceId: string): Promise<Order[]> {
    const rows = await this.prisma.paperOrder.findMany({
      where: { workspaceId },
      include: { lifecycle: { orderBy: { sequence: 'asc' } } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toDomain);
  }
}

function toCreateData(order: Order): Prisma.PaperOrderUncheckedCreateInput {
  return {
    id: order.id,
    workspaceId: order.workspaceId,
    paperAccountId: order.intent.paperAccountId,
    tradingSessionId: order.intent.tradingSessionId,
    clientOrderId: order.intent.clientOrderId,
    intentHash: order.intent.intentHash,
    idempotencyKey: order.intent.idempotencyKey,
    instrument: order.intent.instrument,
    side: order.intent.side,
    type: order.intent.type,
    quantity: order.intent.quantity,
    limitPrice: order.intent.limitPrice,
    filledQuantity: order.filledQuantity,
    status: order.status,
    version: order.version,
    intent: order.intent as unknown as Prisma.InputJsonValue,
    riskDecisionId: order.riskDecisionId,
    reservationId: order.reservationId,
    adapterOrderId: order.adapterOrderId,
    rejectionReason: order.rejectionReason,
    createdAt: new Date(order.createdAt),
    recordedAt: new Date(order.recordedAt),
  };
}

function toUpdateData(order: Order): Prisma.PaperOrderUpdateManyMutationInput {
  return {
    status: order.status,
    version: order.version,
    filledQuantity: order.filledQuantity,
    riskDecisionId: order.riskDecisionId,
    reservationId: order.reservationId,
    adapterOrderId: order.adapterOrderId,
    rejectionReason: order.rejectionReason,
    recordedAt: new Date(order.recordedAt),
  };
}

function toLifecycleData(
  order: Order,
  entry: OrderLifecycleEntry,
): Prisma.OrderLifecycleEntryUncheckedCreateInput {
  return {
    orderId: order.id,
    workspaceId: order.workspaceId,
    sequence: entry.sequence,
    fromStatus: entry.fromStatus,
    toStatus: entry.toStatus,
    eventType: entry.eventType,
    reason: entry.reason,
    actorId: entry.actorId,
    correlationId: entry.correlationId,
    occurredAt: new Date(entry.occurredAt),
    recordedAt: new Date(entry.recordedAt),
  };
}

function toDomain(row: PaperOrderWithLifecycle): Order {
  if (!isOrderStatus(row.status)) throw new Error(`unsupported order status: ${row.status}`);
  const intent = parseIntent(row.intent);
  if (
    intent.orderId !== row.id ||
    intent.intentHash !== row.intentHash ||
    intent.clientOrderId !== row.clientOrderId ||
    intent.workspaceId !== row.workspaceId
  ) {
    throw new Error('persisted order intent identity mismatch');
  }
  const lifecycle = Object.freeze(
    row.lifecycle.map((entry) => {
      if (!isOrderStatus(entry.toStatus)) {
        throw new Error(`unsupported lifecycle status: ${entry.toStatus}`);
      }
      if (entry.fromStatus !== null && !isOrderStatus(entry.fromStatus)) {
        throw new Error(`unsupported lifecycle from status: ${entry.fromStatus}`);
      }
      return Object.freeze({
        sequence: entry.sequence,
        fromStatus: entry.fromStatus as OrderStatus | null,
        toStatus: entry.toStatus as OrderStatus,
        eventType: entry.eventType,
        reason: entry.reason,
        actorId: entry.actorId,
        correlationId: entry.correlationId,
        occurredAt: entry.occurredAt.toISOString(),
        recordedAt: entry.recordedAt.toISOString(),
      });
    }),
  );
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    intent,
    status: row.status as OrderStatus,
    version: row.version,
    filledQuantity: row.filledQuantity.toFixed(),
    riskDecisionId: row.riskDecisionId,
    reservationId: row.reservationId,
    adapterOrderId: row.adapterOrderId,
    rejectionReason: row.rejectionReason,
    lifecycle,
    createdAt: row.createdAt.toISOString(),
    recordedAt: row.recordedAt.toISOString(),
  });
}

function parseIntent(value: Prisma.JsonValue): OrderIntent {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('persisted order intent must be an object');
  }
  const input = value as Record<string, unknown>;
  const checkpoint = object(input.marketCheckpoint, 'market checkpoint');
  const side = enumValue(input.side, OrderSide, 'order side');
  const type = enumValue(input.type, OrderType, 'order type');
  return createOrderIntent({
    clientOrderId: string(input.clientOrderId, 'clientOrderId'),
    idempotencyKey: string(input.idempotencyKey, 'idempotencyKey'),
    workspaceId: string(input.workspaceId, 'workspaceId'),
    paperAccountId: string(input.paperAccountId, 'paperAccountId'),
    tradingSessionId: string(input.tradingSessionId, 'tradingSessionId'),
    sessionFencingToken: number(input.sessionFencingToken, 'sessionFencingToken'),
    mode: string(input.mode, 'mode') as 'paper',
    origin: string(input.origin, 'origin') as 'manual',
    instrument: string(input.instrument, 'instrument'),
    side,
    type,
    quantity: string(input.quantity, 'quantity'),
    limitPrice: input.limitPrice === null ? null : string(input.limitPrice, 'limitPrice'),
    reduceOnly: side === OrderSide.SELL,
    marketCheckpoint: {
      streamId: string(checkpoint.streamId, 'marketCheckpoint.streamId'),
      sequence: number(checkpoint.sequence, 'marketCheckpoint.sequence'),
      eventId: string(checkpoint.eventId, 'marketCheckpoint.eventId'),
    },
    actorId: string(input.actorId, 'actorId'),
    correlationId:
      input.correlationId === null ? undefined : string(input.correlationId, 'correlationId'),
    occurredAt: string(input.occurredAt, 'occurredAt'),
    recordedAt: string(input.recordedAt, 'recordedAt'),
  });
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`);
  return value;
}

function number(value: unknown, label: string): number {
  if (typeof value !== 'number') throw new Error(`${label} must be a number`);
  return value;
}

function enumValue<T extends string>(value: unknown, values: Record<string, T>, label: string): T {
  if (typeof value !== 'string' || !Object.values(values).includes(value as T)) {
    throw new Error(`${label} is unsupported`);
  }
  return value as T;
}
