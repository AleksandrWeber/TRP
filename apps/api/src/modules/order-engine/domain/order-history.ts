import { assertOrderStatus, type OrderStatus } from './order-status';

/**
 * Immutable order status transition history entry (US206).
 */
export type OrderHistory = Readonly<{
  id: string;
  orderId: string;
  timestamp: string;
  previousStatus: OrderStatus;
  currentStatus: OrderStatus;
  reason: string;
}>;

export type CreateOrderHistoryInput = Readonly<{
  id: string;
  orderId: string;
  timestamp: string;
  previousStatus: OrderStatus | string;
  currentStatus: OrderStatus | string;
  reason: string;
}>;

export function createOrderHistory(input: CreateOrderHistoryInput): OrderHistory {
  const id = required(input.id, 'history id');
  const orderId = required(input.orderId, 'order id');
  assertIso(input.timestamp, 'timestamp');
  const reason = required(input.reason, 'reason');

  return Object.freeze({
    id,
    orderId,
    timestamp: input.timestamp,
    previousStatus: assertOrderStatus(input.previousStatus),
    currentStatus: assertOrderStatus(input.currentStatus),
    reason,
  });
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}
