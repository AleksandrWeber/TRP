import { FinancialDecimal } from '../financial';
import type { Order } from './domain/order';
import type { OrderStatus } from './domain/order-status';
import { requiresRequestedPrice, type OrderType } from './domain/order-type';
import { OrderInvalidStateError, OrderValidationError } from './order-errors';

/**
 * Allowed order status transitions (US206).
 *
 * CREATED → VALIDATED | REJECTED | CANCELLED
 * VALIDATED → PENDING | REJECTED | CANCELLED
 * PENDING → PARTIALLY_FILLED | FILLED | CANCELLED | EXPIRED | REJECTED
 * PARTIALLY_FILLED → PARTIALLY_FILLED | FILLED | CANCELLED | EXPIRED
 */
const ALLOWED_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = Object.freeze({
  CREATED: Object.freeze(['VALIDATED', 'REJECTED', 'CANCELLED'] as const),
  VALIDATED: Object.freeze(['PENDING', 'REJECTED', 'CANCELLED'] as const),
  PENDING: Object.freeze([
    'PARTIALLY_FILLED',
    'FILLED',
    'CANCELLED',
    'EXPIRED',
    'REJECTED',
  ] as const),
  PARTIALLY_FILLED: Object.freeze(['PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED'] as const),
  FILLED: Object.freeze([] as const),
  CANCELLED: Object.freeze([] as const),
  EXPIRED: Object.freeze([] as const),
  REJECTED: Object.freeze([] as const),
});

/**
 * OrderValidator — quantity, price, type, and state-transition checks (US206).
 * Risk checks are performed by Risk Engine (US207) before submit.
 */
export class OrderValidator {
  validateCreateRequest(input: {
    symbol: string;
    side: string;
    type: string;
    quantity: string;
    requestedPrice?: string | null;
    timeInForce?: string;
  }): void {
    if (!input.symbol?.trim()) {
      throw new OrderValidationError('symbol is required');
    }
    try {
      FinancialDecimal.from(input.quantity).assertPositive('quantity');
    } catch (error) {
      throw new OrderValidationError(
        error instanceof Error ? error.message : 'quantity must be greater than zero',
        error,
      );
    }

    const type = String(input.type ?? '').toUpperCase() as OrderType;
    if (requiresRequestedPrice(type)) {
      if (
        input.requestedPrice === undefined ||
        input.requestedPrice === null ||
        input.requestedPrice === ''
      ) {
        throw new OrderValidationError(`${type} orders require a requested price`);
      }
      try {
        FinancialDecimal.from(input.requestedPrice).assertPositive('requestedPrice');
      } catch (error) {
        throw new OrderValidationError(
          error instanceof Error ? error.message : 'invalid requested price',
          error,
        );
      }
    } else if (
      input.requestedPrice !== undefined &&
      input.requestedPrice !== null &&
      input.requestedPrice !== ''
    ) {
      try {
        FinancialDecimal.from(input.requestedPrice).assertPositive('requestedPrice');
      } catch (error) {
        throw new OrderValidationError(
          error instanceof Error ? error.message : 'invalid requested price',
          error,
        );
      }
    }
  }

  validateOrderInvariants(order: Order): void {
    const quantity = FinancialDecimal.from(order.quantity);
    const filled = FinancialDecimal.from(order.filledQuantity);
    const remaining = FinancialDecimal.from(order.remainingQuantity);

    if (!quantity.isPositive()) {
      throw new OrderValidationError('order quantity must be greater than zero');
    }
    if (filled.isNegative()) {
      throw new OrderValidationError('filled quantity cannot be negative');
    }
    if (remaining.isNegative()) {
      throw new OrderValidationError('remaining quantity cannot be negative');
    }
    if (filled.compare(quantity) > 0) {
      throw new OrderValidationError('filled quantity must never exceed requested quantity');
    }
    if (filled.plus(remaining).compare(quantity) !== 0) {
      throw new OrderValidationError('filled + remaining must equal quantity');
    }
  }

  assertTransition(from: OrderStatus, to: OrderStatus): void {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new OrderInvalidStateError(`invalid order status transition: ${from} → ${to}`);
    }
  }

  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  }

  getAllowedTransitions(from: OrderStatus): readonly OrderStatus[] {
    return ALLOWED_TRANSITIONS[from];
  }
}
