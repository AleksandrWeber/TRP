import type { Order } from './domain/order';
import { withOrderStatus } from './domain/order';
import type { OrderStatus } from './domain/order-status';
import { OrderImmutableError, OrderInvalidStateError } from './order-errors';
import { OrderValidator } from './order-validator';

export type TransitionResult = Readonly<{
  order: Order;
  previousStatus: OrderStatus;
  currentStatus: OrderStatus;
  reason: string;
}>;

/**
 * OrderLifecycleManager — validates and applies status transitions (US206).
 */
export class OrderLifecycleManager {
  constructor(private readonly validator = new OrderValidator()) {}

  transition(
    order: Order,
    nextStatus: OrderStatus,
    updatedAt: string,
    reason: string,
  ): TransitionResult {
    if (order.status === 'FILLED') {
      throw new OrderImmutableError();
    }
    try {
      this.validator.assertTransition(order.status, nextStatus);
    } catch (error) {
      if (error instanceof OrderInvalidStateError) throw error;
      throw new OrderInvalidStateError(
        error instanceof Error ? error.message : `invalid transition to ${nextStatus}`,
      );
    }

    const previousStatus = order.status;
    let next = withOrderStatus(order, nextStatus, updatedAt);

    if (nextStatus === 'CANCELLED') {
      next = withOrderStatus(order, nextStatus, updatedAt, { cancelledAt: updatedAt });
    }
    if (nextStatus === 'FILLED' && !order.executedAt) {
      next = withOrderStatus(next, nextStatus, updatedAt, { executedAt: updatedAt });
    }

    this.validator.validateOrderInvariants(next);

    return Object.freeze({
      order: next,
      previousStatus,
      currentStatus: nextStatus,
      reason,
    });
  }

  validate(order: Order, updatedAt: string): TransitionResult {
    return this.transition(order, 'VALIDATED', updatedAt, 'order validated');
  }

  submit(order: Order, updatedAt: string): TransitionResult {
    return this.transition(order, 'PENDING', updatedAt, 'order submitted');
  }

  cancel(order: Order, updatedAt: string, reason = 'order cancelled'): TransitionResult {
    return this.transition(order, 'CANCELLED', updatedAt, reason);
  }

  expire(order: Order, updatedAt: string, reason = 'order expired'): TransitionResult {
    return this.transition(order, 'EXPIRED', updatedAt, reason);
  }

  reject(order: Order, updatedAt: string, reason = 'order rejected'): TransitionResult {
    return this.transition(order, 'REJECTED', updatedAt, reason);
  }
}
