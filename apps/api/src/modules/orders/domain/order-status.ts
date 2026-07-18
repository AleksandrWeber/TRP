export enum OrderStatus {
  PROPOSED = 'proposed',
  RISK_PENDING = 'risk_pending',
  APPROVED = 'approved',
  RESERVED = 'reserved',
  EXECUTABLE = 'executable',
  SUBMITTED = 'submitted',
  ACKNOWLEDGED = 'acknowledged',
  FILLED = 'filled',
  REJECTED = 'rejected',
  CANCEL_PENDING = 'cancel_pending',
  CANCELLED = 'cancelled',
}

export const TERMINAL_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.FILLED,
  OrderStatus.REJECTED,
  OrderStatus.CANCELLED,
]);

const ALLOWED_ORDER_TRANSITIONS: ReadonlyMap<OrderStatus, ReadonlySet<OrderStatus>> = new Map([
  [
    OrderStatus.PROPOSED,
    new Set([OrderStatus.RISK_PENDING, OrderStatus.CANCEL_PENDING, OrderStatus.REJECTED]),
  ],
  [
    OrderStatus.RISK_PENDING,
    new Set([OrderStatus.APPROVED, OrderStatus.REJECTED, OrderStatus.CANCEL_PENDING]),
  ],
  [
    OrderStatus.APPROVED,
    new Set([OrderStatus.RESERVED, OrderStatus.REJECTED, OrderStatus.CANCEL_PENDING]),
  ],
  [
    OrderStatus.RESERVED,
    new Set([OrderStatus.EXECUTABLE, OrderStatus.REJECTED, OrderStatus.CANCEL_PENDING]),
  ],
  [
    OrderStatus.EXECUTABLE,
    new Set([OrderStatus.SUBMITTED, OrderStatus.REJECTED, OrderStatus.CANCEL_PENDING]),
  ],
  [
    OrderStatus.SUBMITTED,
    new Set([OrderStatus.ACKNOWLEDGED, OrderStatus.REJECTED, OrderStatus.CANCEL_PENDING]),
  ],
  [
    OrderStatus.ACKNOWLEDGED,
    new Set([OrderStatus.FILLED, OrderStatus.REJECTED, OrderStatus.CANCEL_PENDING]),
  ],
  [OrderStatus.CANCEL_PENDING, new Set([OrderStatus.CANCELLED, OrderStatus.FILLED])],
  [OrderStatus.FILLED, new Set()],
  [OrderStatus.REJECTED, new Set()],
  [OrderStatus.CANCELLED, new Set()],
]);

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_ORDER_TRANSITIONS.get(from)?.has(to) ?? false;
}

export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`invalid order transition: ${from} → ${to}`);
  }
}

export function isOrderStatus(value: string): value is OrderStatus {
  return Object.values(OrderStatus).includes(value as OrderStatus);
}
