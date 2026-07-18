import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { Order } from '../domain/order';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderRepository {
  create(order: Order, transaction: TransactionContext): Promise<Order>;

  save(order: Order, expectedVersion: number, transaction: TransactionContext): Promise<Order>;

  findById(workspaceId: string, orderId: string): Promise<Order | null>;

  findByIdempotencyKey(workspaceId: string, idempotencyKey: string): Promise<Order | null>;

  findByClientOrderId(workspaceId: string, clientOrderId: string): Promise<Order | null>;

  listByWorkspace(workspaceId: string): Promise<Order[]>;
}
